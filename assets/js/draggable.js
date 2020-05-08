function clamp(x, lower, upper) {
	return Math.max(lower, Math.min(x, upper));
}

function linspace(start, end, n) {
	n = typeof n === "undefined" ? 500 : n;
	if (n <= 0) return [];
	var arr = Array(n-1);
	for (var i=0; i<=n-1; i++) {
		arr[i] = ((n-1-i)*start + i*end) / (n-1);
	}
	return arr;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // var testdata = {
		// test: {
			// x: [0, 99, 100, 199, 200, 299, 300, 399, 400, 450],
			// y: [0, 0, 10, 10, 0, 0, 35, 35, 0, 0],
			// range: {x: [-50, 450], y: [-1, 90]}
		// },
        // Akima: {
            // x: [0, 2, 3, 5, 6, 8, 9, 11, 12, 14, 15],
            // y: [10, 10, 10, 10, 10, 10, 10.5, 15, 50, 60, 85],
            // range: {x: [-1, 16], y: [0, 90]}
        // },
        // Hussain1: {
            // x: [-9, -8, -4, 0, 4, 8, 9],
            // y: [7, 5, 3.5, 3.25, 3.5, 5, 7],
            // range: {x: [-11, 10], y: [3, 8]}
        // },
        // Hussain2: {
            // x: [1, 1.5, 1.75, 2, 2.5, 3, 5, 10, 10.5, 11, 12],
            // y: [10, 7, 5, 2.5, 1, 0.6, 0.4, 1, 3, 5, 9],
            // range: {x: [-1, 13], y: [0, 11]}
        // },
        // WolbergAlfy1: {
            // x: [0, 1, 2, 3, 4, 4.5, 6, 7, 7.3, 9, 10, 11],
            // y: [0, 1, 4.8, 6, 8, 13, 14, 15.5, 18, 19, 23, 24.1],
            // range: {x: [-1, 11.5], y: [0, 26]}
        // },
        // WolbergAlfy2: {
            // x: [0.0196, 0.1090, 0.1297, 0.2340, 0.2526, 0.3003, 0.3246, 0.3484, 0.3795, 0.4289,
                // 0.4603, 0.4952, 0.5417, 0.6210, 0.6313, 0.6522, 0.6979, 0.7095, 0.8318, 0.8381],
            // y: [4, 4.5, 14, 16, 24, 30, 28, 35, 36, 38, 39, 40, 30, 23, 20, 19, 18, 5, 4, 3],
            // range: {x: [-0.1, 0.85], y: [0, 43]}
        // },
        // monotonicMotivation: {
            // x: [1, 2, 3.6, 4, 5.8, 6, 10],
            // y: [6, 2, 2, 7, 7, 1, 9],
            // range: {x: [0, 10.3], y: [0, 10]}
        // },
        // cardinalFail: {
            // x: [1, 2, 3, 4, 5, 6, 6.5, 7, 7.5, 8, 8.5],
            // y: [0, 1, 2, 3, 4, 5, 4, 3, 2, 1, 0],
            // range: {x: [0, 9], y: [0, 6]}
        // },
        // endpointsOnly: {
            // x: [1, 10],
            // y: [1, 1],
            // range: {x: [0, 10.3], y: [0, 10]}
        // },
        // hiddenDemo: {
            // x: [1, 2, 6, 7, 8],
            // y: [2, 1, 4, 0, 0],
            // range: {x: [0, 8.2], y: [-1, 5]}
        // },  
    // }
	
    
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////	
	
	
	var trash_svg = '<svg class="trash" width="20" height="20" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M704 736v576q0 14-9 23t-23 9h-64q-14 0-23-9t-9-23v-576q0-14 9-23t23-9h64q14 0 23 9t9 23zm256 0v576q0 14-9 23t-23 9h-64q-14 0-23-9t-9-23v-576q0-14 9-23t23-9h64q14 0 23 9t9 23zm256 0v576q0 14-9 23t-23 9h-64q-14 0-23-9t-9-23v-576q0-14 9-23t23-9h64q14 0 23 9t9 23zm128 724v-948h-896v948q0 22 7 40.5t14.5 27 10.5 8.5h832q3 0 10.5-8.5t14.5-27 7-40.5zm-672-1076h448l-48-117q-7-9-17-11h-317q-10 2-17 11zm928 32v64q0 14-9 23t-23 9h-96v948q0 83-47 143.5t-113 60.5h-832q-66 0-113-58.5t-47-141.5v-952h-96q-14 0-23-9t-9-23v-64q0-14 9-23t23-9h309l70-167q15-37 54-63t79-26h320q40 0 79 26t54 63l70 167h309q14 0 23 9t9 23z"/></svg>';

    /* We have 4 different types of handles:
        normal      standard draggable handle
        endpoint    only draggable in y direction, can't be deleted
        spawn       the dummy handle used for spawning new handles, not included in the interpolation
        hidden      like a normal handle but invisible, can't be moved or deleted
    */	

class PlotlyDraggable {
		
		
	  constructor(fig, initdata, layout, callback) {
			this.fig = fig;
			this.figElement = document.getElementById(fig);
			this.initdata = initdata;
			//this.layout = layout;
			this.callback = callback;
			
			this.interpMethod = 'Linear'; // Linear, FiniteDifference, Cardinal, FritschCarlson, FritschButland, Steffen
			this.interpTension = 0.5; // [0,1], only used for Cardinal splines
			
			this.firstx = initdata.x[0]; // Position of the leftmost breakpoint. Drag a handle beyond this to delete it.
			
			this.init(fig, layout); // load plot
			
			this.processData(); // create handles from initdata
			
			this.updateFigure();
			this.updatePointHandles();
			this.startDragBehavior();
		}
		  //////////////////
		  init(fig, layout){
			
			layout.showlegend = false;
			
			var interpline = { x: [1, 8], y: [1, 40], type: 'scatter', mode: 'lines', hoverinfo: 'none' }; //TBD HIDE/SHOW THIS IF CLASS PARAMETER
			var bps = { x: [1, 8], y: [5, 30], type: 'scatter', cliponaxis: false, mode: 'markers',
			marker: { size: 15, symbol: "circle-open-dot", color: '#b00', line: { width: 2 } }, hoverinfo: 'none'};
			
			var fe = this.figElement;
			fe.innerHTML = trash_svg;
			var trash = this.trash = fe.querySelector(".trash");
			
			Plotly.plot(fe, [interpline, bps], layout, {staticPlot: true});

			//var pc = figurecontainer.querySelector(".scatterlayer .trace:last-of-type g");
			var pc = fe.querySelector(".scatterlayer .trace:last-of-type .points");
			this.points = pc.getElementsByTagName("path");
			//console.log(points);
			
			var xsp = this.xspawn = 20; var ysp = this.yspawn = 90;       // pixel coordinates of the spawn handle
			var trashsize = trash.getAttribute("width");
			pc.parentNode.insertBefore(trash, pc);
			//console.log((xspawn - trashsize/2) + "," + (yspawn - trashsize/2 + 5));
			trash.setAttribute("transform", "translate(" + (xsp - trashsize/2) + "," + (ysp - trashsize/2 + 5) + ")");
			trash.setAttribute("display", "none");
			
		}
		
		processData(){
			this.handles = [];   // the global list of handles
			var id = this.initdata;
			
			Plotly.relayout(this.figElement, {
				'xaxis.range': id.range.x,
				'yaxis.range': id.range.y
			})
			var type;
			
			this.addHandle('spawn');
			for (var i=0, len = id.x.length; i < len; i++) {
				type = i == 0 || i == len-1 ? "endpoint" : "normal";
				this.addHandle(type, id.x[i], id.y[i]);
			}
		}
		
		updateInterp(interpMethod, interpTension=0){
			this.interpMethod = interpMethod;
			this.interpTension = interpTension;
			this.updateFigure();
			this.callback();
		}
		
		///////////////////////////////////////////////////////////////////////////
		////////////////////////// HANDLING HANDLES ///////////////////////////////
		///////////////////////////////////////////////////////////////////////////
		sortedHandles() {
			var hs = this.handles;
			hs.sort(function(a,b) {
				return a.x-b.x;
			});
			var x = [], y = [], xvis = [], yvis = [], xmin = Infinity, xmax = -Infinity;
			for (var i=0; i < hs.length; i++) {
				if (hs[i].type != 'spawn') {
					x.push(hs[i].x);
					y.push(hs[i].y);
					xmin = hs[i].x < xmin ? hs[i].x : xmin;
					xmax = hs[i].x > xmax ? hs[i].x : xmax;
				}
				if (hs[i].type != 'hidden') {
					xvis.push(hs[i].x);
					yvis.push(hs[i].y);
				}
			}
			return {x: x, y: y, xvis: xvis, yvis: yvis, xmin: xmin, xmax: xmax};
		}
		
		updateFigure() {
		
			var sortedhandles = this.sortedHandles();
			var xx = linspace(sortedhandles.xmin, sortedhandles.xmax, 1000);
			//var xx = linspace(sortedhandles.xmin, sortedhandles.xmax, (sortedhandles.xmax - sortedhandles.xmin)/(0.0001)) );
			
			var interp = new Interpolator();
			var yy = interp.cubicHermite(xx, sortedhandles.x, sortedhandles.y, this.interpMethod,this.interpTension); // TBD DON'T PERFORM THIS IF TOGGLE IS SET TO NO INTERPLINE
			
			Plotly.restyle(this.figElement, {'x': [xx, sortedhandles.xvis], 'y': [yy, sortedhandles.yvis]});
			
			this.sohandles = sortedhandles;			
		}

		updatePointHandles() {
			var handles = this.handles;
			for (var i=0, p=0; i < handles.length; i++) {
				if (handles[i].type != 'hidden') {
					this.points[p++].handle = handles[i];
				}
			}
		}

		destroyHandle(handle) {
			var i = this.handles.indexOf(handle);
			this.handles.splice(i,1);
			this.updateFigure();
		}

		// NOT USED
		// poofHandle(handle) {
			// Plotly.d3.select(this.points[0]).transition().duration(500)
				// .attr("transform", "translate(" + this.xspawn + "," + this.yspawn + ") scale(0)")
				// .each("end", function() {
					// destroyHandle(handle);
				// });
		// }

		addHandle(type, x, y) {
			if (type == 'spawn') {
				x = this.figElement._fullLayout.xaxis.p2l(this.xspawn);
				y = this.figElement._fullLayout.yaxis.p2l(this.yspawn);
			}
			var newhandle = {
				x: x,
				y: y,
				type: type
			};
			this.handles.push(newhandle);
			return newhandle;
		}
		
		///////////////////////////////////////
		/////// Handle Drag Behaviour /////////
		///////////////////////////////////////
		startDragBehavior() {
			var d3 = Plotly.d3;
			var drag = d3.behavior.drag();
			var plot = this;
			drag.origin(function() {
				var transform = d3.select(this).attr("transform");
				var translate = transform.substring(10, transform.length-1).split(/,| /);
				return {x: translate[0], y: translate[1]};
			});
			drag.on("dragstart", function() {
				if (this.handle.type != 'spawn') {
					plot.trash.setAttribute("display", "inline");
					plot.trash.style.fill = "rgba(0,0,0,.2)";
					plot.destroyHandle(plot.points[0].handle);
				}
			});
			drag.on("drag", function() {
				var xmouse = d3.event.x, ymouse = d3.event.y;
				d3.select(this).attr("transform", "translate(" + [xmouse, ymouse] + ")");
				var xaxis = plot.figElement._fullLayout.xaxis;
				var yaxis = plot.figElement._fullLayout.yaxis;
				var handle = this.handle;
				if (handle.type != 'endpoint') handle.x = clamp(xaxis.p2l(xmouse), xaxis.range[0], xaxis.range[1] - 1e-9);
				if (handle.type == 'spawn' && handle.x > plot.handles[1].x) {
					plot.trash.setAttribute("display", "inline");
					plot.trash.style.fill = "rgba(0,0,0,.2)";
					handle.type = 'normal';
				}
				handle.y = clamp(yaxis.p2l(ymouse), yaxis.range[0], yaxis.range[1]);
				if (handle.x < plot.firstx) {    // release from the interpolation if dragged beyond the leftmost breakpoint
					handle.type = 'spawn';
					plot.trash.style.fill = "#a00";              
				}
				plot.updateFigure();
			});
			drag.on("dragend", function() {
				if (this.handle.x < plot.firstx) plot.destroyHandle(this.handle);
				plot.addHandle('spawn');
				plot.updateFigure();
				plot.updatePointHandles();
				plot.trash.setAttribute("display", "none");
				d3.select(".scatterlayer .trace:last-of-type .points path:last-of-type").call(drag);   

				plot.callback();
			});
			d3.selectAll(".scatterlayer .trace:last-of-type .points path").call(drag);
		}
}

    
