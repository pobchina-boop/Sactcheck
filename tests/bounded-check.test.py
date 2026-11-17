"""Fault-injection checks for deadlines, failure reporting and child cleanup."""
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import tempfile
import time
import unittest

RUNNER = Path(__file__).resolve().parents[1] / 'tools/run-bounded-check.py'


class BoundedCheckTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.root = Path(self.directory.name)
        self.addCleanup(self.directory.cleanup)

    def command(self, code, seconds=3, browser=False):
        return [sys.executable, str(RUNNER), '--seconds', str(seconds), '--output',
                str(self.root / 'attempt'), *(['--browser'] if browser else []),
                '--', sys.executable, '-c', code]

    def run_check(self, code, **kwargs):
        result = subprocess.run(self.command(code, **kwargs), capture_output=True, timeout=12)
        return result, json.loads((self.root / 'attempt/status.json').read_text())

    def test_success_records_output_and_refuses_to_overwrite_it(self):
        result, status = self.run_check("print('retained evidence')")
        self.assertEqual(result.returncode, 0)
        self.assertEqual(status['status'], 'passed')
        before = (self.root / 'attempt/status.json').read_bytes()
        again = subprocess.run(self.command("print('replacement')"), capture_output=True, timeout=5)
        self.assertNotEqual(again.returncode, 0)
        self.assertEqual(before, (self.root / 'attempt/status.json').read_bytes())
        self.assertIn('retained evidence', (self.root / 'attempt/stdout.log').read_text())

    def test_real_failure_keeps_nonzero_exit(self):
        result, status = self.run_check("import sys; print('assertion failure'); sys.exit(7)", browser=True)
        self.assertEqual(result.returncode, 7)
        self.assertEqual(status['status'], 'failed')

    def test_socket_denial_is_blocked_and_still_nonzero(self):
        result, status = self.run_check("import sys; print('socket() failed: Operation not permitted'); sys.exit(1)", browser=True)
        self.assertEqual(result.returncode, 1)
        self.assertEqual(status['status'], 'blocked_environment')

    def test_missing_command_has_durable_failure(self):
        command = self.command('pass')
        command[-3:] = ['/no/such/sactcheck-command']
        result = subprocess.run(command, capture_output=True, timeout=5)
        status = json.loads((self.root / 'attempt/status.json').read_text())
        self.assertEqual(result.returncode, 127)
        self.assertEqual(status['status'], 'failed_to_start')

    @unittest.skipUnless(sys.platform == 'linux', 'Linux /proc verifies descendant termination')
    def test_timeout_kills_a_stubborn_descendant(self):
        pidfile = self.root / 'descendant.pid'
        child = "import signal,time; signal.signal(signal.SIGTERM,signal.SIG_IGN); time.sleep(60)"
        code = (f"import subprocess,sys,time,pathlib; p=subprocess.Popen([sys.executable,'-c',{child!r}]); "
                f"pathlib.Path({str(pidfile)!r}).write_text(str(p.pid)); time.sleep(60)")
        result, status = self.run_check(code, seconds=0.5)
        self.assertEqual(result.returncode, 124)
        self.assertEqual(status['status'], 'timed_out')
        self.assertLess(status['elapsed_seconds'], 5)
        pid = int(pidfile.read_text())
        proc = Path(f'/proc/{pid}/stat')
        for _ in range(20):
            if not proc.exists() or proc.read_text().split()[2] == 'Z':
                break
            time.sleep(0.05)
        else:
            os.kill(pid, signal.SIGKILL)
            self.fail('Descendant still running after timeout cleanup')

    def test_termination_signal_preserves_interrupted_status(self):
        process = subprocess.Popen(self.command('import time; time.sleep(60)', seconds=60),
                                   stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        try:
            deadline = time.monotonic() + 3
            while time.monotonic() < deadline:
                path = self.root / 'attempt/status.json'
                if path.exists() and json.loads(path.read_text())['status'] == 'running':
                    break
                time.sleep(0.02)
            else:
                self.fail('Runner never reached running state')
            process.terminate()
            process.communicate(timeout=8)
            status = json.loads(path.read_text())
            self.assertEqual(process.returncode, 143)
            self.assertEqual(status['status'], 'interrupted')
        finally:
            if process.poll() is None:
                process.kill()
                process.communicate()


if __name__ == '__main__':
    unittest.main(verbosity=2)
