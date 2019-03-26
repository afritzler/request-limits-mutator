#!/bin/bash

gcloud functions deploy mutator --memory 128Mb --runtime nodejs8 --trigger-http