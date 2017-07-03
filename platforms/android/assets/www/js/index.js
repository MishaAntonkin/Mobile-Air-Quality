d = document;

var app = {
	
	initialize: function() {
		document.addEventListener('deviceready', this.onDeviceReady, false);
	},
	onDeviceReady: function() {
         
        
		var P1Text = document.getElementById('P1');
		var P2Text = document.getElementById('P2');
		var debug_out = document.getElementById('debug_out');
		var str = '';
		var buffer = [];
		var graph_buffer_p1 = [];
		var graph_buffer_p2 = [];
		var value = 0;
		var pm25_serial = 0;
		var pm10_serial = 0;
		var checksum_is = 0;
		var serial_pos = 0;
		var checksum_ok = 0;
        var check_loc = false;
        var record = false;
        
        initButListeners();
        
        navigator.geolocation.getCurrentPosition(onSuccess, onError);
        
        function onSuccess(position) {
        
            alert("Latt-" + position.coords.latitude  + " Long-" + position.coords.longitude);
        }

        function onError() {
            alert('onError!');
        }
              
        /*My test code for write csv, source code look below*/
        //writeCSV(1,2,3,4,5,6);
        console.log("applicationDirectory: " + cordova.file.applicationDirectory);
        console.log("applicationStorageDirectory: " + cordova.file.applicationStorageDirectory);
        console.log("cacheDirectory: " + cordova.file.cacheDirectory);
        console.log("dataDirectory: " + cordova.file.dataDirectory);
        console.log("externalRootDirectory: " + cordova.file.externalRootDirectory);
        console.log("externalApplicationStorageDirectory: " + cordova.file.externalApplicationStorageDirectory);
        console.log("externalCacheDirectry: " + cordova.file.externalCacheDirectry);
        console.log("externalDataDirectory: " + cordova.file.externalDataDirectory);
        
		// request permission first
		serial.requestPermission(
			// if user grants permission
			function(successMessage) {
                // open serial port
                serial.open(
                    {baudRate: 9600},
                    // if port is succesfully opened
                    function(successMessage) {
                        // register the read callback

							serial.registerReadCallback(
								function success(data){
									// decode the received message
									var view = new Uint8Array(data);
									setTimeout(function(){
										if(view.length >= 1) {
											for(var i=0; i < view.length; i++) {
												buffer.push(view[i]);
											}
										}
										while (buffer.length > 0) {
											value = buffer.shift();
//											console.log(value);
											switch (serial_pos) {
												case 0: if (value != 170) { serial_pos = -1; }; break;
												case 1: if (value != 192) { serial_pos = -1; }; break;
												case 2: pm25_serial = value; checksum_is = value; break;
												case 3: pm25_serial += (value << 8); checksum_is += value; break;
												case 4: pm10_serial = value; checksum_is += value; break;
												case 5: pm10_serial += (value << 8); checksum_is += value; break;
												case 6: checksum_is += value; break;
												case 7: checksum_is += value; break;
												case 8:
													if (value == (checksum_is % 256)) { checksum_ok = 1; } else { serial_pos = -1; }; break;
												case 9: if (value != 171) { serial_pos = -1; }; break;
											}
											serial_pos++;
											if (serial_pos == 10 && checksum_ok == 1) {
												if ((! isNaN(pm10_serial)) && (! isNaN(pm25_serial))) {
													P1Text.innerText = (pm10_serial/10).toFixed(1);
													P2Text.innerText = (pm25_serial/10).toFixed(1);
													while (graph_buffer_p1.length >= 500) graph_buffer_p1.shift();
													while (graph_buffer_p2.length >= 500) graph_buffer_p2.shift();
													graph_buffer_p1.push(pm10_serial/10);
													graph_buffer_p2.push(pm25_serial/10);
												}
												serial_pos = 0; checksum_ok = 0; pm10_serial = 0.0; pm25_serial = 0.0; checksum_is = 0;
											}
										}
//										debug_out.innerText = graph_buffer_p1.length;
										var canvas = document.getElementById("graph");
										var canvas_width = Math.min(document.getElementById("value_out").offsetWidth,500);
										canvas.style.width = canvas_width+"px";

										var graph_offset = Math.max(0,(graph_buffer_p1.length-canvas.width))
										console.log("Buffer length: "+graph_buffer_p1.length+", Canvas width (calc): "+canvas_width+", Canvas width: "+canvas.width+", Canvas height: "+canvas.height+", Offset: "+graph_offset);

										if (canvas.getContext) {

											var ctx = canvas.getContext("2d");
											
											ctx.clearRect(0,0,canvas.width, canvas.height);
											
											ctx.strokeStyle = "gray";
											ctx.beginPath();
											ctx.moveTo(0,0);
											ctx.lineTo(canvas.width-1,0);
											ctx.lineTo(canvas.width-1,149);
											ctx.lineTo(0,149);
											ctx.lineTo(0,0);
											ctx.stroke();

											ctx.beginPath();
											ctx.moveTo(0,100);
											ctx.lineTo(canvas.width-1,100);
											ctx.stroke();

											ctx.beginPath();
											ctx.moveTo(0,50);
											ctx.lineTo(canvas.width-1,50);
											ctx.stroke();

											var max_p1 = 150;
											for (var i=graph_offset; i < graph_buffer_p1.length; i++) {
												if (graph_buffer_p1[i] > max_p1) { max_p1 = graph_buffer_p1[i]; }
											}

											scaling = (Math.floor(max_p1/100)+1)*100/150;
											console.log(max_p1+", "+scaling);

											ctx.strokeStyle = "rgb(200,0,0)";
											ctx.beginPath();
											ctx.moveTo(0,150-(graph_buffer_p1[graph_offset]/scaling))
											for (var i=graph_offset; i < graph_buffer_p1.length; i++) {
												ctx.lineTo(i-graph_offset, 150-Math.round(graph_buffer_p1[i]/scaling));
												ctx.stroke();
											}

											ctx.strokeStyle = "rgb(0, 0, 200)";
											ctx.beginPath();
											ctx.moveTo(0,150-(graph_buffer_p2[graph_offset]/scaling))
											for (var i=graph_offset; i < graph_buffer_p2.length; i++) {
												ctx.lineTo(i-graph_offset, 150-Math.round(graph_buffer_p2[i]/scaling));
												ctx.stroke();
											}
										}
									},200);
								},
								// error attaching the callback
								errorCallback
							);
					},
					// error opening the port
					errorCallback
				);
			},
			// user does not grant permission
			errorCallback
		);

        
        function initButListeners() {
            var GeolocBtn = d.getElementById('GeolocBtn');
            var RecordBtn = d.getElementById('RecordBtn');
            
            GeolocBtn.addEventListener('click', switchGeo);
            RecordBtn.addEventListener('click', switchRec);
            
        }
        
        function switchGeo() {
            if(hasClass(this, 'off')) {
                swapClass(this, 'off', 'on');
                check_loc = true;
            } else {
                swapClass(this, 'on', 'off');
                check_loc = true;
            }
        }
        
        function switchRec() {
            if(hasClass(this, 'off')) {
                swapClass(this, 'off', 'on');
                record = true;
            } else {
                swapClass(this, 'on', 'off');
                record = true;
            }
        }

	function hasClass(obj, cls) {
		
		if(obj.className.indexOf(cls) > -1) {
			return true;
		} else {
			return false;
		}
	}

	function removeClass(obj, cls) {
		var classes = obj.className.split(" ");

		for (var i = 0; i < classes.length; i++) {
			if(classes[i] == cls) {
				classes.splice(i, 1);
				i -=1;
			}
		}
		obj.className = classes.join(" ");
	}

	function addClass(obj, cls) { 
	
		var classes = obj.className ? obj.className.split(" ") : [];
	
		for(var i = 0; i < classes.length; i++) {
	
			if (classes[i] == cls) return;
		}
		classes.push(cls);
		obj.className = classes.join(" ");
        }

	function swapClass(obj, oldcls, newcls) {
 		removeClass(obj, oldcls);
		addClass(obj, newcls);
        
	}
    }
};

var errorCallback = function(message) {
			alert('Error: ' + message);
		};


app.initialize();



function writeCSV(fileName, Pm_25, Pm_10, lat, long, date) {
    //Original CSV Pm25, Pm10, lat, long, utc
    //temporary date
    //DEFAULT
    var now = new Date;
    date =  deleteCountrySeason(now);
    fileName = 'Airlogger_Date_Time_Nummber.csv';
    
    dataline = Pm_25 +','+Pm_10+','+lat + ',' + long + ',' + date + '\n';
    console.log(dataline);
    
    writeToFile(fileName, true, dataline);    

}
    
function deleteCountrySeason(date) {
    console.log(typeof(date));
    dateStr = date.toString();
    index = dateStr.indexOf('(');
    newdate = dateStr.slice(0,index-1);
    return newdate;
}

function writeToFile(fileName, isAppend, dataline) {
    
        window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (dirEntry) {
            isAppend = true;
            createFile(dirEntry, fileName , isAppend, dataline);
        }, errorCallback);
    
}

function createFile(dirEntry, fileName, isAppend, dataline) {
    // Creates a new file or returns the file if it already exists.
    dirEntry.getFile(fileName, {create: true, exclusive: false}, function(fileEntry) {

        writeFile(fileEntry, dataline, isAppend);

    }, errorCallback);

}
        
function writeFile(fileEntry, dataObj, isAppend) {
            // Create a FileWriter object for our FileEntry (log.txt).
    fileEntry.createWriter(function (fileWriter) {

        fileWriter.onwriteend = function() {
            readFile(fileEntry);
            };

        fileWriter.onerror = function (e) {
            console.log("Failed file read: " + e.toString());
            };

            // If we are appending data to file, go to the end of the file.
        if (isAppend) {
            try {
                fileWriter.seek(fileWriter.length);
                }
            catch (e) {
                console.log("file doesn't exist!");
                }
            }
            fileWriter.write(dataObj);
        });
}
        
function readFile(fileEntry) {

    fileEntry.file(function (file) {
    var reader = new FileReader();

    reader.onloadend = function() {
        console.log("Successful file read: " + this.result);
    };

    reader.readAsText(file);

    }, errorCallback);
}
    