'use strict';

const jsonPatch = require('fast-json-patch');

exports.mutator = function mutator (req, res) {
  var admissionRequest = req.body;

  // something fishy is going on here
  if (admissionRequest.request.object == null) {
    console.log("got nothing");
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify("{}"));
    res.status(200).end();
  }

  var objectOriginal = admissionRequest.request.object;
  var objectClone = JSON.parse(JSON.stringify(objectOriginal));

  // make sure everything passes the admission
  var admissionReviewResponse = {
    uid: admissionRequest.request.uid,
    allowed: true
  };

  var admissionReview = {
    response: admissionReviewResponse
  };

  switch (admissionRequest.request.kind.kind) {
    case "StatefulSet":
    case "DaemonSet":
    case "Deployment": {
        objectClone.spec.template.spec.containers.forEach(container => {
          if (container.resources != null) {
            delete container.resources;
          }
        });
        break;
    }
    default: {
        // somehow we got the wrong kind here
        console.log(`Unsupported object Kind: ${admissionRequest.request.kind.kind}. Defaulting to approve without mutation`)
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(admissionReview));
        res.status(200).end();
        return;
    }
  }

  var patch = jsonPatch.compare(objectOriginal, objectClone)
  var patchString = JSON.stringify(patch)
  var patchBase64 = Buffer.from(patchString).toString('base64')

  if (patch.length > 0) {
      admissionReviewResponse.patchType = "JSONPatch";
      admissionReviewResponse.patch = patchBase64;
  }

  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(admissionReview));
  res.status(200).end();
};