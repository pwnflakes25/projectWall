import { Component, OnInit, ViewChild, ElementRef} from '@angular/core';
import * as tracking from 'tracking';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  @ViewChild('myCanvas') canvas: ElementRef<HTMLCanvasElement>;
  @ViewChild('video') video: ElementRef<HTMLVideoElement>;
  title = 'projectWall';
  compatible: boolean;
  fromColor: string = '#ffffff';
  toColor: string = '#9B870C';
  gradients: {};
  context: CanvasRenderingContext2D;


ngOnInit() {
 this.compatible = this.hasGetUserMedia();
 this.context = this.canvas.nativeElement.getContext('2d');
}


/* Stream it to video element */
openVideo() {
  this.video.nativeElement.setAttribute('playsinline', '');
  this.video.nativeElement.setAttribute('autoplay', '');
  this.video.nativeElement.setAttribute('muted', '');

  /* Setting up the constraint */
  var facingMode = "user"; // Can be 'user' or 'environment' to access back or front camera (NEAT!)
  var constraints = {
    audio: false,
    video: {
     facingMode: facingMode
    }
  };
 //if device has feature, open camera
 if(this.compatible) {
   navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
     this.video.nativeElement.srcObject = stream;
   });
 }
 else {
   console.log("This device does not support camera");
 }
}

openCanvas() {
  console.log(this.video)
  if (this.video.nativeElement.readyState === 4) {
    this.drawFrame(this.video.nativeElement)
  } else {
    this.video.nativeElement.addEventListener('play', this.drawFrame);
  }
}


drawFrame(video) {
  let fps = 45;
  let begin = Date.now();
  this.context.drawImage(video, 0, 0);
  var imageData = this.context.getImageData(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    this.applyContrast(imageData.data, 20);
  this.changeWhiteToYellow(imageData.data);
  this.applyContrast(imageData.data, 1);
  this.context.putImageData(imageData, 0, 0);


   let delay = 1000/fps- (Date.now() - begin);
  setTimeout(() => {
   this.drawFrame(video);
 }, delay);
}

 applyBrightness(data, brightness) {
  for (var i = 0; i < data.length; i+= 4) {
    data[i] += 255 * (brightness / 100);
    data[i+1] += 255 * (brightness / 100);
    data[i+2] += 255 * (brightness / 100);
  }
}

truncateColor(value) {
  if (value < 0) {
    value = 0;
  } else if (value > 255) {
    value = 255;
  }

  return value;
}

 applyContrast(data, contrast) {
  var factor = (259.0 * (contrast + 255.0)) / (255.0 * (259.0 - contrast));

  for (var i = 0; i < data.length; i+= 4) {
    data[i] = this.truncateColor(factor * (data[i] - 128.0) + 128.0);
    data[i+1] = this.truncateColor(factor * (data[i+1] - 128.0) + 128.0);
    data[i+2] = this.truncateColor(factor * (data[i+2] - 128.0) + 128.0);
  }
}



changeWhiteToYellow(data) {
  let red = new Array();
  let green = new Array();
  let blue = new Array();
  let alpha = new Array();

  for (let i = 0; i < data.length; i += 4)
  {
    red[i] = data[i];
    if (red[i] <= 255 && red[i] >= 170 ) red[i] = 255;
    green[i] = data[i+1];
    if (green[i] <= 255 && green[i] >= 170) green[i] = 255;
    blue[i] = data[i+2];
    if (blue[i] <= 255 && blue[i] >= 170) blue[i] = 0;
    alpha[i] = 255;
  }

  // Write the image back to the canvas
  for (let i = 0; i < data.length; i += 4)
  {
    data[i] = red[i];
    data[i+1] = green[i];
    data[i+2] = blue[i];
    data[i+3] = alpha[i];
  }
}





stringToHex(string: string) {
  let result;
  if (string[0] === '#') {
    string = string.substr(1);
  }

  result = parseInt(string, 16);
  return result;
}

createGradient(fromHex, toHex) {
  if (this.gradients[fromHex + toHex]) {
    return this.gradients[fromHex + toHex];
  }

  var gradient = [];
  var maxValue = 255;
  var from = this.getRGBColor(fromHex);
  var to = this.getRGBColor(toHex);

  for (var i = 0; i <= maxValue; i++) {
    var intensityB = i;
    var intensityA = maxValue - intensityB;

    gradient[i] = {
      r: (intensityA*from.r + intensityB*to.r) / maxValue,
      g: (intensityA*from.g + intensityB*to.g) / maxValue,
      b: (intensityA*from.b + intensityB*to.b) / maxValue
    };
  }

  this.gradients[fromHex + toHex] = gradient;

  return gradient;
}

// getRGBColor(hex) {
//     var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
//     return result ? {
//       r: parseInt(result[1], 16),
//       g: parseInt(result[2], 16),
//       b: parseInt(result[3], 16)
//     } : null;
// }

getRGBColor(hex) {
  var colorValue;

  if (hex[0] === '#') {
    hex = hex.substr(1);
  }

  colorValue = parseInt(hex, 16);

  return {
    r: colorValue >> 16,
    g: (colorValue >> 8) & 255,
    b: colorValue & 255
  }
}

hasGetUserMedia() {
return !!(navigator.mediaDevices &&
  navigator.mediaDevices.getUserMedia);
}

}
