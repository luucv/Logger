const Transmitter = require('xdrip-js');
const util = require('util')

const id = process.argv[2];
// FIXME, process.argv[3] should probably just be a file containing an array of messages to send the transmitter instead of a json string.
// examples mesages are: {date: Date.now(), type: "CalibrateSensor", glucose} or {date: Date.now(), type: "StopSensor"} or {date: Date.now(), type: "StartSensor"}
const messages =  JSON.parse(process.argv[3] || '[]');
//console.log('messages to send: ' + JSON.stringify(messages));
//messages.push({date: Date.now(), type: "CalibrateSensor", glucose})
//const transmitter = new Transmitter(id); 
//

process.on('uncaughtException', function(e) {
    console.error(e.stack);

     /// Makesure error outputed before process exit.
    process.stderr.write('', function () {
        process.exit(1);
    });
});

function TransmitterStatusString(status) {
 switch (status) {
   case null:
    return '--';
   case 0x00:
     return "OK";
   case 0x81:
     return "Low battery";
   case 0x83:
     return "Expired";
   default:
     return status ? "Unknown: 0x" + status.toString(16) : '--';
   }
}


function SensorStateString(state) {
  switch (state) {	
     case 0x00:	
       return 'None';	
     case 0x01:	
       return 'Stopped';	
     case 0x02:	
       return 'Warmup';	
     case 0x03:	
       return 'Excess Noise';
     case 0x04:	
       return 'First calibration';	
     case 0x05:	
       return 'Second calibration';	
     case 0x06:	
       return 'OK';	
     case 0x07:	
       return 'Needs calibration';	
    case 0x08:
        return 'Confused Calibration 1'; 
      case 0x09:
        return 'Confused Calibration 2';
     case 0x0a:
        return 'Needs More Calibration';
      case 0x0b:
        return 'Sensor Failed Due to Counts Aberration';
      case 0x0c:
        return 'Sensor Failed Due to Residual Aberration';
      case 0x0d:
        return 'Outlier Calibration';
      case 0x0e:
        return 'Needs More Calibration due to Outlier';
      case 0x0f:
        return 'Sensor Session Ended';
      case 0x10:
        return 'Sensor Failed Due To Unrecoverable Error';
      case 0x11:
        return 'Transmitter Problem';
      case 0x12:
        return 'Temporary Session Error';
      case 0x13:
        return 'Sensor Failed 4';
      case 0x14:
        return 'Sensor Failed 5';
      case 0x15:
        return 'Sensor Failed 6';
      case 0x16:
        return 'Sensor Failed Start';
      case 0x80:
        return 'Calibration State - Start';
      case 0x81:
        return 'Calibration State - Start Up';
      case 0x82:
        return 'Calibration State - First of Two Calibrations Needed';
     case 0x83:
        return 'Calibration State - High Wedge Display With First BG';
      case 0x84:
        return 'Unused Calibration State - Low Wedge Display With First BG';
      case 0x85:
        return 'Calibration State - Second of Two Calibrations Needed';
      case 0x86:
        return 'Calibration State - In Calibration Transmitter';
      case 0x87:
        return 'Calibration State - In Calibration Display';
      case 0x88:
        return 'Calibration State - High Wedge Transmitter';
      case 0x89:
        return 'Calibration State - Low Wedge Transmitter';
      case 0x8a:
        return 'Calibration State - Linearity Fit Transmitter';
      case 0x8b:
        return 'Calibration State - Out of Cal Due to Outlier Transmitter';
      case 0x8c:
        return 'Calibration State - High Wedge Display';
      case 0x8d:
        return 'Calibration State - Low Wedge Display';
      case 0x8e:
        return 'Calibration State - Linearity Fit Display';
      case 0x8f:
        return 'Calibration State - Session Not in Progress';
     default:	
       return state ? "Unknown: 0x" + state.toString(16) : '--';	
  }
}

const transmitter = new Transmitter(id, () => messages); 

transmitter.on('glucose', glucose => {
  //console.log('got glucose: ' + glucose.glucose);
  var d= new Date(glucose.readDate);

  console.log(util.inspect(glucose, false, null))
  var fs = require('fs');
  const extra = [{
      'state_id': glucose.state, 
      'status_id': glucose.status, 
      'transmitterStartDate': glucose.transmitterStartDate 
    }];
    const extraData = JSON.stringify(extra);
  const entry = [{
      'device': 'DexcomR4',
      'date': d.getTime(),
      'dateString': d.toISOString(),
      //'sgv': Math.round(glucose.unfiltered/1000),
      'sgv': glucose.glucose,
      'direction': 'None',
      'type': 'sgv',
      'filtered': Math.round(glucose.filtered),
      'unfiltered': Math.round(glucose.unfiltered),
      'rssi': glucose.rssi, 
      'noise': "1",
      'trend': glucose.trend,
      'state': SensorStateString(glucose.state), 
      'status': TransmitterStatusString(glucose.status), 
      'glucose': Math.round(glucose.glucose)
    }];
    const data = JSON.stringify(entry);

/*  if(glucose.unfiltered > 500000 || glucose.unfiltered < 30000) // for safety, I'm assuming it is erroneous and ignoring
    {
      console.log("Error - bad glucose data, not processing");
      process.exit();
    }
*/
    fs.writeFile("/root/myopenaps/monitor/xdripjs/extra.json", extraData, function(err) {
    if(err) {
        console.log("Error while writing extra.json");
        console.log(err);
        }
        fs.writeFile("/root/myopenaps/monitor/xdripjs/entry.json", data, function(err) {
        if(err) {
            console.log("Error while writing entry.json");
            console.log(err);
            }
        process.exit();
        });
    });
});

transmitter.on('sawTransmitter', data => {
  const util = require('util')
  console.log('got sawTransmitter message inside logger msg: ' + JSON.stringify(data));
  console.log(util.inspect(data, false, null))

  var fs = require('fs');
  const sawTransmitter = JSON.stringify(data);
  fs.writeFile("/root/myopenaps/monitor/xdripjs/saw-transmitter.json", sawTransmitter, function(err) {
  if(err) {
      console.log("Error while writing saw-transmitter.json");
      console.log(err);
      }
  });
});

transmitter.on('batteryStatus', data => {
  const util = require('util')
  console.log('got batteryStatus message inside logger msg: ' + JSON.stringify(data));
  console.log(util.inspect(data, false, null))

  var fs = require('fs');
  const battery = JSON.stringify(data);
  fs.writeFile("/root/myopenaps/monitor/xdripjs/cgm-battery.json", battery, function(err) {
  if(err) {
      console.log("Error while writing cgm-battery.json");
      console.log(err);
      }
  });
});

transmitter.on('disconnect', process.exit);

transmitter.on('messageProcessed', data => {
  console.log('got message inside logger msg: ' + JSON.stringify(data));
  console.log(util.inspect(data, false, null))
});

transmitter.on('backfillData', backfills => {
  //console.log('got glucosebackfill: ' + JSON.stringify(backfills));

   var newEntries = [];
  var fs = require('fs');
  for (var i = 0; i < backfills.length; ++i) {
    const backfill = backfills[i];
    //console.log('processing backfill entry:' + JSON.stringify(backfill));
    const entry = {
        'device': 'DexcomR4B',
        'date': backfill.time,
        'dateString': new Date(backfill.time).toISOString(),
        'sgv': backfill.glucose,
        'direction': 'None',
        'type': 'sgv',
        'trend': backfill.trend,
        'state': SensorStateString(backfill.type), 
        'glucose': Math.round(backfill.glucose)
      };
    //console.log('resulting backfill entry:' + JSON.stringify(entry));
    newEntries.push(entry);
  }
  console.log('New backfill entries:' + JSON.stringify(newEntries));
  fs.readFile('/root/myopenaps/monitor/xdripjs/entry-backfill2.json', function (err, data) {
      var json = [];
      if (data && data.length > 0) {
        json = JSON.parse(data);
      }
      json = json.concat(newEntries);
      console.log("full backfill entries to upload: " + JSON.stringify(json));
      fs.writeFile('/root/myopenaps/monitor/xdripjs/entry-backfill2.json', JSON.stringify(json))
  });
});
