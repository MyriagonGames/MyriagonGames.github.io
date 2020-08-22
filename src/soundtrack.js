function play(context, type, value, delay, length) {
    let oscillator = context.createOscillator();
    let gainNode = context.createGain();
    let timeStart = context.currentTime + delay;
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.type = type || 'sine';
    oscillator.frequency.value = value;
    gainNode.gain.setValueAtTime(0, timeStart);
    gainNode.gain.linearRampToValueAtTime(0.2, timeStart + 0.01);      
    oscillator.start(timeStart);
    gainNode.gain.exponentialRampToValueAtTime(0.001, timeStart + length);
    oscillator.stop(timeStart + length);
}

let context = new window.AudioContext();

function playSound(value, delay, type, length) {
	if(value){
    let freq = 440 * Math.pow(Math.pow(2.0, 1/12), value - 49);
    play(context, type, freq, delay, length);
  }
}

let tempo = 250;
//[20,25,30,35,39,44] //guitar strings to remind me
let C = [28,32,35,40,35,32];
let D = [30,37,42,46,42,37];
let G = [23,27,30,35,30,27];


let riff1 = [21,21,21,21, 26,26,26,26, 24,24,24,24, 29,29,29,29];
let riff2 = [,,,,,,,, ,,,,,,,, ,,,,,,,, ,,,,,,40,43];
let riff3 = [33,,,33,33,,,, ,,38,,38,,,, 36,,,36,36,,,, ,,41,,41,,,,];
//let riff4 = [,,,,38,,41,,43,,34, ,,41,,42,41,,39, ,38,,39,,38,,, ,,,,,]; TODO

[...riff1,...riff1,...riff1,...riff1].forEach((x,i) => playSound(x,i*100/tempo, 'square', 2)); //bass
[...riff2,...riff2,...riff2,...riff2].forEach((x,i) => playSound(x,i*50/tempo, 'triangle', 10)); //lead guitar
//[...riff4,...riff4].forEach((x,i) => playSound(x,i*50/tempo, 'sqaure', 4)); //vocal/solo
[...riff3,...riff3,...riff3,...riff3].forEach((x,i) => playSound(x,i*50/tempo, 'sawtooth', 1)); //rhythm guitar
