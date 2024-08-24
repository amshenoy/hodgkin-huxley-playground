# [Hodgkin-Huxley Model](https://en.wikipedia.org/wiki/Hodgkin-Huxley_model)

This web app is just for demonstration purposes only as there is no explicit interface to allow the change of parameters however the full mathematics behind the neuron model can be viewed in the simulate.js file.

[Hodgkin-Huxley Playground](https://amshenoy.github.io/hodgkin-huxley-playground)


## Explanation

This project is a dedicated example of a differential equation solver for a neuron model with other analysis plots.
This was an extension on the [population simulator](https://git.amshenoy.com/population-simulator) to consider not just static initial-value inputs with compartmental models (such as Lotka-Volterra or SEIRD) but also general dynamical systems with dynamic continuous-time inputs.
In this particular example, the input current applied to the model is the only input however our draggable Plotly interface allows us to input a time-dependent input for analysing the behaviour.

Hodgkin–Huxley model can be thought of as a differential equation system with four state variables. 
$V_m(t)$, $m(t)$, $n(t)$, $h(t)$ that change with respect to time $t$.
The system is difficult to study because it is a nonlinear system, cannot be solved analytically, and therefore has no closed-form solution. However, there are many numerical methods available to analyze the system.
Certain properties and general behaviors, such as limit cycles, can be proven to exist.

We can directly view the phase plane for viewing these limit cycles as well as plotting the membrane currents to view the Hopf bifurcation of the model.
