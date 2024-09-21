#!/usr/bin/python3

import hashlib
import re
import requests
import sys
import tempfile

STUDIO_URL = "https://developer.android.com/studio"
REGEX_BUNDLE_LINK = r"https:\/\/\S*\/android-studio-\S*-linux\.tar\.gz"
REGEX_VERSION = r"\d+\.\d+\.\d+\.\d+"
FP_BUILD = "static/build.html"


def get_bundle_link(page_content, regex):
    return re.search(regex, page_content).group()


def get_checksum(url):
    print(f"Downloading from: {url}")
    req = requests.get(url, stream=True, timeout=5)
    with tempfile.TemporaryFile() as fp:
        for chunk in req.iter_content(chunk_size=1024):
            fp.write(chunk)
        print("Download finished")
        fp.seek(0)
        return hashlib.sha256(fp.read()).hexdigest()


if __name__ == "__main__":
    # Fetch Android Studio page
    page_studio = requests.get(STUDIO_URL, timeout=5).text
    bundle_link_android = get_bundle_link(page_studio, REGEX_BUNDLE_LINK)

    # Read local build.html
    with open(FP_BUILD) as f:
        page_build = f.read()
    bundle_link_grapheneos = get_bundle_link(page_build, REGEX_BUNDLE_LINK)

    # Extract versions from the bundle links
    android_version = re.search(REGEX_VERSION, bundle_link_android).group()
    grapheneos_version = re.search(REGEX_VERSION, bundle_link_grapheneos).group()

    if android_version <= grapheneos_version:
        print("Android Studio is up to date")
        sys.exit()

    print("Android Studio update available...")
    new_link = bundle_link_grapheneos.replace(grapheneos_version, android_version)

    # Download new version and get checksum
    checksum_android = get_checksum(new_link)

    if checksum_android not in page_studio:
        print("Checksum mismatch! Exiting...")
        sys.exit()

    print(f"Hash matches. Updating {FP_BUILD}...")

    # Replace version and checksum in build page
    updated_build = page_build.replace(grapheneos_version, android_version)

    regex_filename = re.compile(r"android-studio-\S*-linux\.tar\.gz")
    filename_grapheneos = regex_filename.search(updated_build).group()

    checksum_grapheneos = re.search(
        rf"'(\S*)  {filename_grapheneos}'", updated_build
    ).group(1)
    updated_build = updated_build.replace(checksum_grapheneos, checksum_android)

    with open(FP_BUILD, "w") as f:
        f.write(updated_build)

    sys.exit(f"{FP_BUILD} overwritten. Please commit and push the change.")
