# Celcat2GoogleAgenda

Export the Celcat timetable to our Google Agenda.

## Links
[GSIG1](https://calendar.google.com/calendar/u/0?cid=Y19zOGJvOXEyNXBqNTVoZzRvbTRiOWllNjloMEBncm91cC5jYWxlbmRhci5nb29nbGUuY29t) <br>
[GSIG2](https://calendar.google.com/calendar/u/0?cid=Y19idXRqc2QxNGhiMGJrcWJrcm51Mzdxa2IxOEBncm91cC5jYWxlbmRhci5nb29nbGUuY29t) <br>
[MI](https://calendar.google.com/calendar/u/0?cid=Y18wdmhiNDI5M245aXAyN3VtcWszZWo5dmVnc0Bncm91cC5jYWxlbmRhci5nb29nbGUuY29t)

## Setting up a GCP project


## Installation
Step 1 : clone the repository : `git clone git@gitlab.etude.eisti.fr:dusartvict/celcat2googleagenda.git` <br>
Step 2 : move to the corresponding directory : `cd celcat2googleagenda` <br>
Step 3 : install dependencies : `npm install` <br>
Step 4 : create a `.env` at the root of the project and paste these contents : 
```bash
NAME=<celcat-username-here>
PASSWORD=<celcat-password-here>
```

## Requirements
This bot was written with [Node.js](https://nodejs.org/) version 16.8.0. For a full list of dependencies see `package.json`.

## Authors
Lucas DRAESCHER (draescherl@cy-tech.fr) <br>
Victor DUSART (dusartvict@cy-tech.fr)