<?php

// alphanumerical ID of the plugin; never change this
$id = "xmmp";

// code version; must be changed for all code changes
define('xmmp_version', "1.7.0");
$version = xmmp_version;

// ilias min and max version; must always reflect the versions that should
// run with the plugin
$ilias_min_version = "10.0";
$ilias_max_version = "10.999";

// optional, but useful: Add one or more responsible persons and a contact email
$responsible = "Aresch Yavari";
$responsible_mail = "ay at databay.de";

// Required so CLI setup can run the plugin Setup Agent (RBAC registration).
$supports_cli_setup = true;
