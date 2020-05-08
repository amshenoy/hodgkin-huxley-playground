
	importScripts('./odex.js', './interpolator.js');
	// importScripts('./interpolator.js');
	
	/////////////////UTILS//////////////////
	///////////////////////////////////////
	const arrCol = (arr, n) => arr.map(x => x[n]);
	
	function func_map(func, param_arrs){
		var res = [];
		
		// parameter arrays in the form [[a1, a2, a3, ..., etc], [b1, b2, b3, ..., etc], [c1, c2, c3, ..., etc] ]
		for (var i=0; i < param_arrs[0].length; i++){
			// convert to  [[a1, b1, c1], [a2, b2, c2], ..., etc.]
			var params = arrCol(param_arrs, i);
			// apply function to each array and push each result to array
			res.push(func.apply(null, params));
		}
		//console.log(res);
		//return res; // array of result arrays (one function run returns an array) or array of values (one function run returns a value)
		
		// if array of arrays
		if (Array.isArray(res[0])){
			var res_cols = [];
			for (var i=0; i < res[0].length; i++){
				var res_col = arrCol(res, i);
				res_cols.push(res_col);
			}
			return res_cols; // array of columns
		// if array of values
		}else{
			return res; // return array of values
		}
	}
	///////////////////////////////////////
	
	/////////////
	// Constants
	/////////////
	var C_m = 1.0; // membrane capacitance, in uF/cm^2
	// maximum conducances, in mS/cm^2
	var g_Na = 120.0; var g_K = 36.0; var g_L = 0.3;
	// Nernst reversal potentials, in mV
	var E_Na = 50.0; var E_K = -77.0; var E_L = -54.387;
	////////////////////////

	// Channel gating kinetics
	// Functions of membrane voltage
	function alpha_m(V){ return -0.1*(25-(V+65))/(1 - Math.exp(2.5-0.1*(V+65))); }
	function beta_m(V){ return 4.0*Math.exp(-(V+65)/18); }
	function alpha_h(V){ return 0.07*Math.exp(-(V+65)/20); }
	function beta_h(V){ return 1/(1 + Math.exp(3-0.1*(V+65))); }
	function alpha_n(V){ return -0.01*(10-(V+65))/(1 - Math.exp(1 - 0.1*(V+65.0))); }
	function beta_n(V){ return 0.125*Math.exp(-(V+65) / 80.0); }

	// Membrane currents (in uA/cm^2)
	//  Sodium (Na = element name)
	function I_Na(V,m,h){ return g_Na * m**3 * h * (V - E_Na); }
	//  Potassium (K = element name)
	function I_K(V, n){ return g_K  * n**4 * (V - E_K); }
	//  Leak
	function I_L(V){ return g_L * (V - E_L); }

	var interp = new Interpolator();
	// External current
	function I_inj(t){
		// step up 10 uA/cm^2 at t=100ms, etc...
		//return 10*(t>100) - 10*(t>200) + 35*(t>300) - 35*(t>400);
		var res = interp.cubicHermite([t], globalhandles.x, globalhandles.y, interpMethod, interpTension);
		return res[0];
	}

	// Integrate!
	function dFdt(t, X){
		var [V, m, h, n] = X;
		
		// calculate membrane potential & activation variables
		var dVdt = (I_inj(t) - I_Na(V, m, h) - I_K(V, n) - I_L(V)) / C_m;
		var dmdt = alpha_m(V)*(1-m) - beta_m(V)*m;
		var dhdt = alpha_h(V)*(1-h) - beta_h(V)*h;
		var dndt = alpha_n(V)*(1-n) - beta_n(V)*n;
		return [dVdt, dmdt, dhdt, dndt];
		
	}
	
	function run_model(){
		var num_vars = 4;
		var s = new Solver(num_vars);
		// var [t_start, t_end] = [0, 450];
		var [t_start, t_end] = [globalhandles.xmin, globalhandles.xmax];
		
		var [t, V, m, h, n] = [[], [], [], [], []];
		s.denseOutput = true;
		// s.solve(dFdt, t_start, [-65, 0.05, 0.6, 0.32], t_end, s.grid(0.01, function(x,y) { 
		s.solve(dFdt, t_start, [-65, 0.05, 0.6, 0.32], t_end, s.grid(0.1, function(x,y) { 
			t.push(x);
			V.push(y[0]);
			m.push(y[1]);
			h.push(y[2]);
			n.push(y[3]);
		}));
		
		//console.log(m, h, n);
		var i_inp = func_map(I_inj, [t]);
		var ina = func_map(I_Na, [V,m,h]);
		var ik = func_map(I_K, [V,n]);
		var il = func_map(I_L, [V]);
		//console.log(ina, ik, il);
		return [t, V, m, h, n, i_inp, ina, ik, il];
	}
	
	var globalhandles = {};
	var interpMethod = "";
	var interpTension = 0;
	
	self.onmessage = function(event) {
		[globalhandles, interpMethod, interpTension] = event.data;

		console.log("Starting Simulation...");
		var t0 = performance.now();
		var sim_data = run_model();
		var t1 = performance.now();
		console.log("Model run took " + (t1 - t0) + " milliseconds.");
		console.log("Simulation Complete!");
		
		self.postMessage(sim_data);
	}