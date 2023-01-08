
foreach ($file in Get-ChildItem -filter "*.json") {
$fname = $file.Name.split('.')[0]

New-Item "$fname.xml" -ItemType File
Add-Content "$fname.xml" "<?xml version=`"1.0`" encoding=`"UTF-8`" standalone=`"yes`"?>"

$jsonString = Get-Content $file
$jsonObj = $jsonString | ConvertFrom-Json

$msgcount = $jsonObj.messages.count
Add-Content "$fname.xml" "<smses count=`"$msgcount`">"

foreach ($msg in $jsonObj.messages) {

$msgtext = $msg.message
$msgdir = $msg.message_direction
$msgdate = [string]((([long]((Get-Date $msg.date -UFormat %s)))+18000)*1000) # utc time in ms, adjusted for gmt-05
$msgcontact = $msg.contact_value

Add-Content "$fname.xml" "  <sms address=`"$msgcontact`" date=`"$msgdate`" type=`"$msgdir`" body=`"$msgtext`" read=`"1`" status=`"-1`"/>"

}

Add-Content "$fname.xml" "</smses>"

}
