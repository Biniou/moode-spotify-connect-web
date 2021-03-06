# moode-spotify-connect-web
Work in progresse :/!\

moOde OS - spotify-web-connect install instructions and required files for raspberry pi B (ARM7 version).

The fantastic moOde OS and moOde Audio Player by Tim Curtis (audiophile-quality playback for the RPi3) can be found at:
http://moodeaudio.org/

The great spotify-connect-web (a Spotify Connect server to be run inside Linux OSs) can be found at:
https://github.com/Fornoth/spotify-connect-web

Dependencies:
=============

- avahi-utils for zero-conf multiuser (this will prevent the need of user and password, but it is yet another service that needs to be run!)
- python-dev and other utils for compiling the main software

```
$ sudo apt-get install avahi-utils
$ sudo apt-get install python-dev libffi-dev libasound2-dev
```

Moode 6.0 +
========================

On télécharge la version Chroot de spotify connect :


```
$ cd /home/pi curl -O curl -OL https://github.com/Fornoth/spotify-connect-web/releases/download/0.0.4-alpha/spotify-connect-web.sh 
$ chmod u+x spotify-connect-web.sh 
# Download the current chroot (~ 180 MB) 

$ ./spotify-connect-web.sh install 
# Copy your `spotify_appkey.key` into the app directory. 

$ wget https://github.com/RafaPolit/moode-spotify-connect-web/raw/master/spotify_appkey.key 
$ sudo cp spotify_appkey.key spotify-connect-web-chroot/usr/src/app/ 

# Run using normal cmdline options for teste
./spotify-connect-web.sh --username 12345678 --password xyz123 --bitrate 320
````

On créé l’exécutable
========================

```
$ nano spotify-connect.sh
```

Dans le fichier sh coller :

```
#!/bin/bash
set -e  #quitte en cas d'erreur c'est crade mais ca marche

DIR=~/spotify-connect-web-chroot #variable du dossier

trap "sudo umount $DIR/dev $DIR/proc" EXIT 2 3 #A l'interception de la fin du programme on démonte les dossier exit ou CTRL+C
sudo mount --bind /dev $DIR/dev
sudo mount -t proc proc $DIR/proc/
# sudo cp /etc/resolv.conf $DIR/etc/
sudo chroot $DIR /bin/bash -c "cd /usr/src/app && python main.py --playback_device softvol -m Master --mixer_device_index 0 --name Moode$ #on execute main.py avec les parametres
```



Please note that the softvol playback device and the Master mixer is something we will create afterwards.  Also, the **--mixer_device_index** would require some experimentation, depending on your setup.  More on this later.

You need to make the file executable:

```
$ sudo chmod 755 spotify-connect.sh
```

Configuring the services
========================

We want to configure both avahi and spotify to start with the device.  For that:

```
$ cd /lib/systemd/system/
$ sudo vim avahi-spotify-connect-multiuser.service
```

Inside place the following:
```
Description=Avahi Spotify Connect Multiuser
After=network.target

[Service]
ExecStart=/usr/bin/avahi-publish-service TestConnect _spotify-connect._tcp 4000 VERSION=1.0 CPath=/login/_zeroconf
Restart=always
RestartSec=10
StartLimitInterval=30
StartLimitBurst=20

[Install]
WantedBy=multi-user.target
```

Then:
```
$ sudo vim spotify-connect-web.service
```

An place inside the following:
```
Description=Spotify Connect Web
After=network.target avahi-spotify-connect-multiuser.service

[Service]
User=pi
ExecStart=/home/pi/spotify/spotify-connect.sh
Restart=always
RestartSec=10
StartLimitInterval=30
StartLimitBurst=20

[Install]
WantedBy=multi-user.target
```

Audio softvol configuration
===========================

The idea is to have a softvol software device mapped to our soundcard into which we create a Master volume control.  This will prevent the spotify connect system from changing the main volume from the hardware.  For determining which are your devices available, run:

```
$ aplay -L
```

and also run:
```
$ amixer controls
```

This will give you some idea of which is your hardware (hw) device and which mixer you want it mapped to.

With that info do:
```
$ cd /home/pi/spotify-connect-web-chroot/etc
$ sudo vim asound.conf
$
```

Fill the file with this code:
```
pcm.softvol {
  type softvol
  slave {
    pcm "hw:0"
  }
  control {
    name "Master"
    card 0
  }
}
```

This is a 'best bet' approach.  For other i2c devices you probably need to change hw:1 to hw:0 on the slave -> pcm entry.  Some suggested changing the pcm key with 'digital', or other configs.  Please research how to map your device to a new ALSA virtual channel.  This has proven the most difficult part in the past to get right.

To make sure the mapping work:

First: **LOWER YOUR VOLUME!!!!** (very important, the next step will produce a loud noise on the speakers)

Then:
```
$ speaker-test -Dsoftvol -c2
```

This should alternate playing a noise in each channel of your card.  If this didn't ouput the expected sound, edit the asound.conf file and change the hw:1 value to something meaningful.  For i2c devices and other configurations, please report your success stories in an issue so others can benefit from it.

If things described in the following steps don't work, experiment with other cards (for example hw:0), or change the **--mixer_device_index** in the spotify-connect.sh script to 1.

Enabling the Services
=====================

Lets start the services

```
$ sudo systemctl start avahi-spotify-connect-multiuser.service
$ sudo systemctl start spotify-connect-web.service
```

Test that spotify-connect-web is working with:

```
$ sudo systemctl status spotify-connect-web.service
```

If everything looks OK and you can connect with your phone, tablet or PC, you are done.

If not, change the value of the mixer in the **--mixer_device_index** in the spotify-connect.sh script we created in previous steps.  Please report your success stories so others can benefit from it.


If all went well, you can ENABLE both service to run at startup:

```
$ sudo systemctl enable avahi-spotify-connect-multiuser.service
$ sudo systemctl enable spotify-connect-web.service
```


That's it for now.  Hope this helps someone!

Happy listening.

Rafa.
