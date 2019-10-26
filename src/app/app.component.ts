import { Component, OnInit, ViewChild, ElementRef, Input} from '@angular/core';
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
  initialColor: any;
  finalColor = "#FFFF00";
  finalColorHex;
  initialColorAvailable = false;
  localStream;


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
     this.localStream = stream;
   });
 }
 else {
   console.log("This device does not support camera");
 }
}

stopVideo() {
   this.localStream.getVideoTracks()[0].stop();
}


openCanvas() {
  if (this.video.nativeElement.readyState === 4) {
    this.drawFrame()
  } else {
    this.video.nativeElement.addEventListener('play', this.drawFrame);
  }
}


getInitialColor(event, data) {
  //get mouse position
  const mousePos = {
  x: event.clientX,
  y: event.clientY
 }


 const pixelData = this.context.getImageData(mousePos.x, mousePos.y, this.canvas.nativeElement.width, this.canvas.nativeElement.height).data;

 this.initialColor = {
   r: pixelData[0],
   g: pixelData[1],
   b: pixelData[2]
 }

 this.finalColorHex = this.rgbToHex(this.initialColor.r, this.initialColor.g, this.initialColor.b);
}

resetInitialColor() {
  this.initialColor = {};
}



onColorChange(color) {
  this.finalColor = color;
  console.log(this.finalColor);
}

getFinalColor() {
  return this.finalColor;
}



//this function draws the canvas consistently redrawing the video
drawFrame() {
  let fps = 30;
  let begin = Date.now();
  const vid = this.video.nativeElement;
  this.context.drawImage(vid, 0, 0)
  var imageData = this.context.getImageData(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
  // this.applyContrast(imageData.data, 20);
  // this.changeWhiteToYellow(imageData.data);
  // this.applyContrast(imageData.data, 1);

  this.canvas.nativeElement.addEventListener('click', (e) => {
    console.log(this.finalColor);
    this.getInitialColor(e, imageData.data);
    this.initialColorAvailable = true;
  })
  if(this.initialColorAvailable) {
    this.applyContrast(imageData.data, 20);
    // this.changeFromColortoColor(imageData.data, this.initialColor, this.finalColor, 30);
    this.cutAlphaOfColor(imageData.data, 60);
    this.applyContrast(imageData.data, 1);
  }
  this.context.putImageData(imageData, 0, 0);
 //this function below loops the drawFrame function
 requestAnimationFrame(this.drawFrame.bind(this));
}

//this function modify pixel to have higher brightness to canvas
 applyBrightness(data, brightness) {
  for (var i = 0; i < data.length; i+= 4) {
    data[i] += 255 * (brightness / 100);
    data[i+1] += 255 * (brightness / 100);
    data[i+2] += 255 * (brightness / 100);
  }
}

//this function guard RGB to be within 255 range
truncateColor(value) {
  if (value < 0) {
    value = 0;
  } else if (value > 255) {
    value = 255;
  }
  return value;
}

//this function applies contrast
 applyContrast(data, contrast) {
  var factor = (259.0 * (contrast + 255.0)) / (255.0 * (259.0 - contrast));

  for (var i = 0; i < data.length; i+= 4) {
    data[i] = this.truncateColor(factor * (data[i] - 128.0) + 128.0);
    data[i+1] = this.truncateColor(factor * (data[i+1] - 128.0) + 128.0);
    data[i+2] = this.truncateColor(factor * (data[i+2] - 128.0) + 128.0);
  }
}

//this function is the main logic to change one color to the next
changeFromColortoColor(data, color1, color2, range) {
  let red = new Array();
  let green = new Array();
  let blue = new Array();
  let alpha = new Array();
  color2 = this.getRGBColor(color2);

  for (let i = 0; i < data.length; i += 4)
  {
    red[i] = data[i];
    if (red[i] <= color1.r + range && red[i] >= color1.r - range ) red[i] = color2.r;
    green[i] = data[i+1];
    if (green[i] <= color1.g + range && green[i] >= color1.g - range) green[i] = color2.g;
    blue[i] = data[i+2];
    if (blue[i] <= color1.b + range && blue[i] >= color1.b - range) blue[i] = color2.b;
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

 cutAlphaOfColor(data, range) {
   const color = this.initialColor;
   let red = new Array();
   let green = new Array();
   let blue = new Array();
   let alpha = new Array();

   for (let i = 0; i < data.length; i+=4) {
      red[i] = data[i];
      green[i] = data[i+1];
      blue[i] = data[i+2];
      alpha[i] = data[i+3];
      if (red[i] <= color.r + range && red[i] >= color.r - range
         && green[i] <= color.g + range && green[i] >= color.g - range
         && blue[i] <= color.b + range && blue[i] >= color.b - range) {
           data[i+3] = 30;
         }
    }
}



//first test function
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

//Two function belows change RGB To Hex
componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

rgbToHex(r, g, b) {
  return "#" + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);
}

// createGradient(fromHex, toHex) {
//   if (this.gradients[fromHex + toHex]) {
//     return this.gradients[fromHex + toHex];
//   }
//
//   var gradient = [];
//   var maxValue = 255;
//   var from = this.getRGBColor(fromHex);
//   var to = this.getRGBColor(toHex);
//
//   for (var i = 0; i <= maxValue; i++) {
//     var intensityB = i;
//     var intensityA = maxValue - intensityB;
//
//     gradient[i] = {
//       r: (intensityA*from.r + intensityB*to.r) / maxValue,
//       g: (intensityA*from.g + intensityB*to.g) / maxValue,
//       b: (intensityA*from.b + intensityB*to.b) / maxValue
//     };
//   }
//
//   this.gradients[fromHex + toHex] = gradient;
//
//   return gradient;
// }

getRGBColor(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
}

// getRGBColor(hex) {
//   var colorValue;
//
//   if (hex[0] === '#') {
//     hex = hex.substr(1);
//   }
//
//   colorValue = parseInt(hex, 16);
//
//   return {
//     r: colorValue >> 16,
//     g: (colorValue >> 8) & 255,
//     b: colorValue & 255
//   }
// }

hasGetUserMedia() {
return !!(navigator.mediaDevices &&
  navigator.mediaDevices.getUserMedia);
}

}
