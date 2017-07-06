//GLOBAL VAR
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


		var errorCallback = function(message) {
			alert('Error: ' + message);
		};
              
        /*My test code for write csv, source code look below*/
        //writeCSV(1,2,3,4,5,6);
        //test my Kml code
        //writeKML(0, 0, 0, 0, 0, 0);
        //Test my Kml_line code
        //writeKML_line(1.2, 2.3, 3, 10.321, 123.123, 12.12, 12, 45, 67, 90);
        createDirectory();
        function createDirectory() {
            
             window.resolveLocalFileSystemURL(cordova.file.externalRootDirectory, function (dirEntry) {
                 
                dirEntry.getDirectory('NewDirInRoot', { create: true, exclusive:false }, function (innerdirEntry) {
                
                    console.log(dirEntry.fullPath );
                    console.log(innerdirEntry.fullPath );
                    innerdirEntry.getDirectory("NewNew", {create: true}, function(enter) {}, errorFile);
                    
                }, errorFile);
            
            }, errorFile);
            
            
        }
        
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

app.initialize();


function writeCSV(fileName, Pm_25, Pm_10, lat, lon, date) {
    //Original CSV Pm25, Pm10, lat, long, utc
    //temporary date
    //DEFAULT
    var date =  processDate();
    //Maybe LATER make global var, something like fileNameCSV
    var fileName = 'Airlogger_Date_Time_Nummber.csv';
    
    dataline = Pm_25 +','+Pm_10+','+lat + ',' + lon + ',' + date + '\n';
    console.log(dataline);
    
    writeToFile(fileName, dataObj);    

}

function writeKML(fileName, Pm_25, Pm_10, lat, lon, date) {
    //temporary date
    //DEFAULT
    var date =  processDate();
    //Maybe LATER make global var, something like fileNamekml_25
    var fileName_25 = 'Airlogger_Date_Time_Nummber_25.kml';
    var fileName_10 = 'Airlogger_Date_Time_Nummber_10.kml';
    
    
    var dataObj_25 = formKml("pm_25", Pm_25, date, lon, lat);
    var dataObj_10 = formKml("pm_10", Pm_10, date, lon, lat);
    
    writeToFile_KML(fileName_25, dataObj_25, "25");
    writeToFile_KML(fileName_10, dataObj_10, "10");
}

function writeKML_line(pm_25, pm_10, pm_25_old, pm_10_old, lat, lon, lat_old, lon_old, time, fname) {
    //temporary date
    //DEFAULT
    var date =  processDate();
    //Maybe LATER make global var, something like fileNamekml_25
    var fileName_25 = 'Airlogger_Date_Time_Nummber_25_line.kml';
    var fileName_10 = 'Airlogger_Date_Time_Nummber_10_line.kml';
    
    var dataObj_25 = formKml_line(pm_25, pm_25_old, lat, lon, lat_old, lon_old, date, color_selection(pm_25));
    var dataObj_10 = formKml_line(pm_10, pm_10_old, lat, lon, lat_old, lon_old, date, color_selection(pm_10));
    
    writeToFile_KML(fileName_25, dataObj_25, "25");
    writeToFile_KML(fileName_10, dataObj_10, "10");
}

function formKml(type, pm, time, lon, lat) {
    
    var data = "   <Placemark>\n" 
        + "       <name>"+type+": "+ pm +"</name>\n" 
        + "       <description> Time: " + time + "</description>\n"
        + "       <Point>\n"
		+ "           <coordinates>" + lon + "," + lat + ",0</coordinates>\n"
		+ "       </Point>\n"
        + "   </Placemark>\n";
    return data;
}

function formKml_line(pm, pm_old, lat, lon, lon_old, lat_old, time, color) { 
    
     var data ="   <Placemark>\n"
				+ "       <LineString>\n"
				+ "           <altitudeMode>relativeToGround</altitudeMode>\n"
				+ "           <coordinates>" + lon + "," + lat + "," + pm + "\n "+ lon_old+ ","+ lat_old+ "," + pm_old + "</coordinates>\n"
				+ "       </LineString>\n"
				+ "       <Style>\n"
				+ "           <LineStyle>\n"
				+ "               <color>" + color + "</color>\n"
				+ "               <width>8</width>\n"
				+ "           </LineStyle>\n"
				+ "       </Style>\n"
				+ "   </Placemark>\n";
                           
    return data;
         
    
}
    
function processDate() {
    var date = new Date;
    var dateStr = date.toString();
    var index = dateStr.indexOf('(');
    var newdate = dateStr.slice(0,index-1);
    return newdate;
}

function writeToFile_KML(fileName, dataObj, type) {
    
    window.resolveLocalFileSystemURL(cordova.file.externalRootDirectory, function (dirEntry) {
        
        dirEntry.getFile(fileName, {create: true, exclusive: false}, function(fileEntry) {

           fileEntry.createWriter(function (fileWriter) {

                fileWriter.onwriteend = function() {
                    console.log("Successful file read...");
                    readFile(fileEntry);
                };

                fileWriter.onerror = function (e) {
                    console.log("Failed file read: " + e.toString());
                };

                // If we are appending data to file, go to the end of the file.
                // Maybe later it should be rewrite
                if (fileWriter.length == 0) {
                    
                    try {
                        fileWriter.seek(fileWriter.length);
                        dataObj = "<?xml version='1.0' encoding='UTF-8'?>\n"
				        + "<kml xmlns='http://earth.google.com/kml/2.1'>\n"
				        + "<Document>\n"
				        + "   <name> feinstaub_"+type+"_"+ getYearMonthDate() + ".kml </name>\n"
				        + '\n'
                        + dataObj;
                    }
                
                    catch (e) {
                        console.log("file doesn't exist!");
                    }
                    
                }  else {
                    
                    try {
                    
                        fileWriter.seek(fileWriter.length);
                    
                    }
                    catch (e) {
                        console.log("file doesn't exist!");
                    }
                }
               
                fileWriter.write(dataObj);
        });

        }, errorFile);
            
    }, errorFile);
}

function writeToFile(fileName, dataObj) {
        /*externalRootDirectory*/
        window.resolveLocalFileSystemURL(cordova.file.externalRootDirectory, function (dirEntry) {
            isAppend = true;
            createFile(dirEntry, fileName , dataObj);
        }, errorFile);
    
}

function createFile(dirEntry, fileName, dataObj) {
    // Creates a new file or returns the file if it already exists.
    dirEntry.getFile(fileName, {create: true, exclusive: false}, function(fileEntry) {

        writeFile(fileEntry, dataObj);

    }, errorFile);

}
        
function writeFile(fileEntry, dataObj) {
            // Create a FileWriter object for our FileEntry (log.txt).
    fileEntry.createWriter(function (fileWriter) {

        fileWriter.onwriteend = function() {
            console.log("Successful file read...");
            readFile(fileEntry);
            };

        fileWriter.onerror = function (e) {
            console.log("Failed file read: " + e.toString());
            };
        
        try {
            fileWriter.seek(fileWriter.length);
        }
        catch (e) {
            console.log("file doesn't exist!");
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

    }, errorFile);
}

function color_selection(value) {
	// red
	var color = "#64009614"	
	if (50 <= value <= 2000) {
		color = "#641400F0";
    }
	// orange
	else if (25 <= value <= 49) {
		color = "#641478FF";
    }
	//green
	else if (0 <= value < 25) {
		color = "#64009614";		
    }
	return color;
}

function getYearMonthDate() {
    
    var date = new Date;
    var month =  (date.getUTCMonth() +1) > 9 ? (date.getUTCMonth() + 1) : "0" + (date.getUTCMonth() + 1);
    var day  = date.getUTCDate() > 9 ? date.getUTCDate() : "0"+date.getUTCDate();
    
    return date.getUTCFullYear() + month + day;
    //return date.getFullYear().toString() + (date.getMonth() +1) + date.getUTCDay();
}

function errorFile(message) {
		alert('Error: ' + message);
	};
