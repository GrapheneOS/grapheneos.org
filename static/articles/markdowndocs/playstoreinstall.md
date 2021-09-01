# How to install Google Play Services (sandboxed) with Graphene OS

This document describes how to install the 'very nicely' sandboxed google play services for temermental things like Microsoft apps, etc. that seem to want to work with only 'google play services'. Most of this comes directly from [graphene os faq](https://grapheneos.org/usage#sandboxed-play-services)

## Step 1: Install [com.google.android.gsf](https://apps.grapheneos.org/packages/com.google.android.gsf/) 

Simply click on this link in your browser, and download the apk file. Choose 'install' from your browser.

## Step 2: Install [com.google.android.gms](https://apps.grapheneos.org/packages/com.google.android.gms/)

This installs the gms apk. Same as directions above

## Step 3: (somewhat longer) Download [SAI split bundle installer](https://github.com/Aefyr/SAI/releases/tag/4.5)

Once you have downloaded this, I like to 'clear out' my download directory before continuting using the file manager. This makes it easier for the 'next' step where we download the 5 bundled apk's and install them as our final step of the 'install' piece.

## Step 4: Download and install [com.android.vending](https://apps.grapheneos.org/packages/com.android.vending/) bundle

Save all 5 files but DON't install them. The utility we downloaded in step 3 will do this.

## Step 5: Run the SAI split bundle installer

- Choose -install apk's
- Choose 'internal file picker'
- Choose 'downloads' directory where you downloaded the 5 apk files
- Tick the 5 files in the downloaded directory, hit the 'select button'
- Tick all boxes in the next screen and press 'install'

It will take a while for everthing to install. While its not necessary, I found a 'reboot' after everything was done seemed to clear up my issues. Once that is done you can either use the aurora to install problematic apps, or use play services (I signed in, its supposed to be optional). If you use play services, you will have to look at 'limitations' section of the guide mentioned earlier. Play won't properly detect installs. I just stop it and the utility seems to work. Finally don't update play services with aurora or things will get ugly.  I did get a note from the author, who indicated that 'initializing' play services and will fix this, without a reboot. My experience was that this was not the case.

## Step 6: Enable battery optimization exception (optional)

- Go to "system settings"
- Apps and notifications
- show all apps (look for google play services)
- advanced, then battery, (click on it less than obvious!), click on 'battery optimization', then 'all apps' then 'google play services' and finally "Don't optimize".