"""
PDF cracker — stub
MDX Cyber Security Society

Install dependency:
    pip install pikepdf

Output protocol (same for all crackers):
    PROGRESS:<n>/<total>
    SUCCESS:<password>
    FAILED
    ERROR:<message>
"""

import argparse
import sys

# TODO: import pikepdf


def crack(file_path: str, wordlist_path: str) -> None:
    # TODO: open the PDF with pikepdf
    #   pdf = pikepdf.open(file_path, password=password)
    #   If it opens without raising pikepdf.PasswordError, the password is correct.

    try:
        with open(wordlist_path, "r", encoding="latin-1") as f:
            passwords = [line.rstrip("\n") for line in f]
    except FileNotFoundError:
        print(f"ERROR:Wordlist not found: {wordlist_path}")
        sys.exit(1)

    total = len(passwords)

    for i, password in enumerate(passwords):
        if i % 200 == 0:
            print(f"PROGRESS:{i}/{total}", flush=True)

        # TODO: replace this block with your pikepdf attempt
        # try:
        #     with pikepdf.open(file_path, password=password):
        #         print(f"SUCCESS:{password}", flush=True)
        #         sys.exit(0)
        # except pikepdf.PasswordError:
        #     continue

        pass  # remove this once implemented

    print("FAILED", flush=True)
    sys.exit(0)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="PDF password cracker")
    parser.add_argument("--file",     required=True, help="Path to locked PDF")
    parser.add_argument("--wordlist", required=True, help="Path to wordlist (.txt)")
    args = parser.parse_args()
    crack(args.file, args.wordlist)
