import sys
import os
import subprocess

def run_phase6_e2e_tests():
    print("=" * 70)
    print("ADVERSARIAL CORPORATE AUDITOR -- PHASE 6 END-TO-END WORKFLOW TESTS")
    print("=" * 70)

    tests_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.dirname(tests_dir)

    pytest_cmd = [
        sys.executable, "-m", "pytest",
        os.path.join(tests_dir, "test_phase6_end_to_end.py"),
        "-v", "-s"
    ]

    env = os.environ.copy()
    env["PYTHONPATH"] = backend_dir

    result = subprocess.run(pytest_cmd, cwd=backend_dir, env=env)
    
    print("=" * 70)
    if result.returncode == 0:
        print("[SUCCESS] ALL PHASE 6 END-TO-END TESTS PASSED (100% SUCCESS)!")
    else:
        print("[FAILED] PHASE 6 END-TO-END TESTS FAILED. See log output above.")
    print("=" * 70)

if __name__ == "__main__":
    run_phase6_e2e_tests()
