=== The Paste ===
Contributors: podpirate
Donate link: https://www.paypal.com/donate/?hosted_button_id=F8NKC6TCASUXE
Tags: copy paste, clipboard, media library, productivity
Requires at least: 4.8
Tested up to: 6.3
Requires PHP: 7.4
Stable tag: 2.0.4
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Paste files and image data from clipboard and instantly upload them to the WordPress media library.

== Description ==

Speed up your workflow by pasting files and image data directly into the WordPress media library.

You can copy files and image data from many desktop applications:

* macOS Finder
* Windows Filesystem
* Screenshots
* Adobe Photoshop
* Gimp
* LibreOffice
* GoogleDocs
* [And some more...](https://github.com/mcguffin/the-paste#applications-tested-so-far)

… and paste it to Classic Editor or directly to the media library.

The most recent Desktop versions of Chrome, Firefox, Edge and Safari are supported.

[The paste at GitHub](https://github.com/mcguffin/the-paste)

You like it? You can't stop pasting? [Paste some cash with PayPal](https://www.paypal.com/donate/?hosted_button_id=F8NKC6TCASUXE)!

== Installation ==

Follow the standard [WordPress plugin installation procedere](https://wordpress.org/documentation/article/manage-plugins/).

== Screenshots ==

1. Pasting into classic editor. You can either upload the image immediately or do so later.
2. The media library is pastable too
3. Pasted multiple images from macOS Photos into Chrome
4. A layer pasted from Adobe Photoshop 2023

== Changelog ==

= 2.0.4 =
* Remove debugging artefact

= 2.0.3 =
* UI Tweak (instruction placement)
* Fix: Classic editor plugin crashing
* Fix: sometimes not pasting in Firefox
* Fix: Dialog overlays media frame in Block Editor

= 2.0.2 =
* Paste from Google Docs (Docs and Presentation)
* More Filename placeholders
* Fix PHP Fatal if network activated on a multisite

= 2.0.1 =
* Fix: Filename placeholders

= 2.0.0 =
* Paste files and images in the media Library
* Paste multiple files (except firefox)
* Convert to WebP (except Safari)
* Disable dataURI pasting in user profile (now default)
* Performance: Check upload capability before scripts are loaded

= 1.1.2 =
* Fix: Fatal error in user profile
* Fix: Compatibility with the SEO Framework

= 1.1.1 =
* Feature: Make pasting into tinyMCE optional. (Fixes unpredictable cursor position during file drop)
* Fix: php 8.2 deprecation warnings

= 1.1.0 =
* Fix: PHP 8 warning
* Fix: Add `data:` to wp_kses allowed protocols
* TinyMCE: Users without file upload capability could not paste images as data-url.
* TinyMCE: Don't show upload buttons if user are not allowed to upload files

= 1.0.7 =
* Fix auto upload large images

= 1.0.5 =
* Prevent Editor Crashes: Only embed images up to 262144 px, upload otherwise

= 1.0.4 =
* Support Text Widget
* Better Media Titles

= 1.0.3 =
* Fix JS Error in TextWidget

= 1.0.2 =
* Performance improvements
* Add Textdomain to plugin header
* Remove unnecessary settings

= 1.0.1 =
* Update plugin URL
* Fix double pasting

= 1.0.0 =
* Initial release

== Upgrade Notice ==

Nothing noteworty here so far...
