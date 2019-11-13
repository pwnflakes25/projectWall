import { Component, OnInit, ViewChild, ElementRef, Input} from '@angular/core';
import * as tracking from 'tracking';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  @ViewChild('myCanvas',  {static: true}) canvas: ElementRef<HTMLCanvasElement>;
  @ViewChild('backCanvas',  {static: true}) backCanvas: ElementRef<HTMLCanvasElement>;
  @ViewChild('video',  {static: true}) video: ElementRef<HTMLVideoElement>;

  title = 'projectWall';
  compatible: boolean;
  gradients: {};
  context: CanvasRenderingContext2D;
  initialColor: any;
  finalColor = "#3a243b";
  finalColorHex;
  initialColorAvailable = false;
  localStream;
  sliderValue = 12;


ngOnInit() {
 this.compatible = this.hasGetUserMedia();
 this.context = this.canvas.nativeElement.getContext('2d');
 this.getScreenRes();
}


getScreenRes() {
  let w = window.screen.width;
  console.log(w)
  if(w <= 768) {
    this.video.nativeElement.width = 350;
    this.video.nativeElement.height = 400;
  } else {
    this.video.nativeElement.width = 450;
    this.video.nativeElement.height = 300;
  }
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
   this.video.nativeElement.addEventListener('play', () => {
     this.openCanvas();
   })
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
    this.canvas.nativeElement.width = this.video.nativeElement.width;
    this.canvas.nativeElement.height = this.video.nativeElement.height;
    this.backCanvas.nativeElement.width = this.video.nativeElement.width;
    this.backCanvas.nativeElement.height = this.video.nativeElement.height;
    this.drawFrame();
  } else {
    this.video.nativeElement.addEventListener('play', this.drawFrame);
  }
}


getInitialColor(event, data, canvas) {
 let rect = canvas.getBoundingClientRect();
 this.initialColor = {};
  //get mouse position
  let mousePos = {
  x: event.clientX - rect.left,
  y: event.clientY - rect.top
 }


 const pixelData = this.context.getImageData(mousePos.x, mousePos.y, this.canvas.nativeElement.width, this.canvas.nativeElement.height).data;

 this.initialColor = {
   r: pixelData[0],
   g: pixelData[1],
   b: pixelData[2]
 }

 this.finalColorHex = this.rgbToHex(this.initialColor.r, this.initialColor.g, this.initialColor.b);
}

resetCanvas() {
  this.context.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
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
  //this function below "requestAnimationFrame" loops the drawFrame function
  requestAnimationFrame(this.drawFrame.bind(this));
  const vid = this.video.nativeElement;
  this.context.drawImage(vid, 0, 0, vid.width, vid.height)
  let imageData = this.context.getImageData(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);


  this.canvas.nativeElement.addEventListener('click', (e) => {
    this.getInitialColor(e, imageData.data, this.canvas.nativeElement);
    this.initialColorAvailable = true;
  })
  if(this.initialColorAvailable) {
    this.applyContrast(imageData.data, 20);
    this.cutAlphaOfColorWithLAB(imageData.data);
  }
  this.context.putImageData(imageData, 0, 0);
  return;
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

ApplyInvertColor(data) {
  for (var i = 0; i < data.length; i+= 4) {
    data[i] = data[i] ^ 255; // Invert Red
    data[i+1] = data[i+1] ^ 255; // Invert Green
    data[i+2] = data[i+2] ^ 255; // Invert Blue
  }
}

//this function is the main logic to change one color to the next
// changeFromColortoColor(data, color1, color2, range) {
//   let red = new Array();
//   let green = new Array();
//   let blue = new Array();
//   let alpha = new Array();
//   color2 = this.getRGBColor(color2);
//
//   for (let i = 0; i < data.length; i += 4)
//   {
//     red[i] = data[i];
//     if (red[i] <= color1.r + range && red[i] >= color1.r - range ) red[i] = color2.r;
//     green[i] = data[i+1];
//     if (green[i] <= color1.g + range && green[i] >= color1.g - range) green[i] = color2.g;
//     blue[i] = data[i+2];
//     if (blue[i] <= color1.b + range && blue[i] >= color1.b - range) blue[i] = color2.b;
//     alpha[i] = 255;
//   }
//
//   // Write the image back to the canvas
//   for (let i = 0; i < data.length; i += 4)
//   {
//     data[i] = red[i];
//     data[i+1] = green[i];
//     data[i+2] = blue[i];
//     data[i+3] = alpha[i];
//   }
// }

//  cutAlphaOfColor(data, range) {
//    const color = this.initialColor;
//    let red = new Array();
//    let green = new Array();
//    let blue = new Array();
//    let alpha = new Array();
//
//    for (let i = 0; i < data.length; i+=4) {
//       red[i] = data[i];
//       green[i] = data[i+1];
//       blue[i] = data[i+2];
//       alpha[i] = data[i+3];
//       if (red[i] <= color.r + range && red[i] >= color.r - range
//          && green[i] <= color.g + range && green[i] >= color.g - range
//          && blue[i] <= color.b + range && blue[i] >= color.b - range) {
//            data[i+3] = 100 ;
//          }
//     }
// }

cutAlphaOfColorWithLAB(data) {
  const color = this.initialColor;
  let color2;
  let firstLAB = this.rgb2lab(this.initialColor)
  let secondLAB;
  let deltaEValue;

  for (let i = 0; i < data.length; i+=4) {
     color2 = {
       r: data[i],
       g: data[i+1],
       b: data[i+2]
     }
     secondLAB = this.rgb2lab(color2);
     deltaEValue = this.deltaE(firstLAB, secondLAB);
     if (deltaEValue <= 15) {
       data[i+3] -= 100;
     }
  }
 }

rgb2lab(rgb){
  let r = rgb.r / 255,
      g = rgb.g / 255,
      b = rgb.b / 255,
      x, y, z;

  r = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
  z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

  x = (x > 0.008856) ? Math.pow(x, 1/3) : (7.787 * x) + 16/116;
  y = (y > 0.008856) ? Math.pow(y, 1/3) : (7.787 * y) + 16/116;
  z = (z > 0.008856) ? Math.pow(z, 1/3) : (7.787 * z) + 16/116;

  return [(116 * y) - 16, 500 * (x - y), 200 * (y - z)]
}

deltaE(labA, labB){
  var deltaL = labA[0] - labB[0];
  var deltaA = labA[1] - labB[1];
  var deltaB = labA[2] - labB[2];
  var c1 = Math.sqrt(labA[1] * labA[1] + labA[2] * labA[2]);
  var c2 = Math.sqrt(labB[1] * labB[1] + labB[2] * labB[2]);
  var deltaC = c1 - c2;
  var deltaH = deltaA * deltaA + deltaB * deltaB - deltaC * deltaC;
  deltaH = deltaH < 0 ? 0 : Math.sqrt(deltaH);
  var sc = 1.0 + 0.045 * c1;
  var sh = 1.0 + 0.015 * c1;
  var deltaLKlsl = deltaL / (1.0);
  var deltaCkcsc = deltaC / (sc);
  var deltaHkhsh = deltaH / (sh);
  var i = deltaLKlsl * deltaLKlsl + deltaCkcsc * deltaCkcsc + deltaHkhsh * deltaHkhsh;
  return i < 0 ? 0 : Math.sqrt(i);
}

// cutAlphaOfColorWithHSV(data) {
//   const color = this.rgbTohsv(this.initialColor.r, this.initialColor.g, this.initialColor.b);
//   let red = new Array();
//   let green = new Array();
//   let blue = new Array();
//   let alpha = new Array();
//   let hsv;
//
//
//   for (let i = 0; i < data.length; i+=4) {
//   red[i] = data[i];
//   green[i] = data[i+1];
//   blue[i] = data[i+2];
//   hsv = this.rgbTohsv(red[i], green[i], blue[i]);
//   let hueDifference = Math.abs(hsv.h - color.h);
//   let vDifference = Math.abs(hsv.v - color.v);
//   let sDifference = Math.abs(hsv.s - color.s);
//   if( hueDifference < 20 && vDifference <= 30 && vDifference >= 10 && sDifference <= 20) {
//         data[i+3] = 0;
//   }
//  }
// }


//first test function
// changeWhiteToYellow(data) {
//   let red = new Array();
//   let green = new Array();
//   let blue = new Array();
//   let alpha = new Array();
//
//   for (let i = 0; i < data.length; i += 4)
//   {
//     red[i] = data[i];
//     if (red[i] <= 255 && red[i] >= 170 ) red[i] = 255;
//     green[i] = data[i+1];
//     if (green[i] <= 255 && green[i] >= 170) green[i] = 255;
//     blue[i] = data[i+2];
//     if (blue[i] <= 255 && blue[i] >= 170) blue[i] = 0;
//     alpha[i] = 255;
//   }
//
//   // Write the image back to the canvas
//   for (let i = 0; i < data.length; i += 4)
//   {
//     data[i] = red[i];
//     data[i+1] = green[i];
//     data[i+2] = blue[i];
//     data[i+3] = alpha[i];
//   }
// }

//Two function belows change RGB To Hex
componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

rgbToHex(r, g, b) {
  return "#" + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);
}

rgbTohsv (r, g, b) {
    let rabs, gabs, babs, rr, gg, bb, h, s, v, diff, diffc, percentRoundFn;
    rabs = r / 255;
    gabs = g / 255;
    babs = b / 255;
    v = Math.max(rabs, gabs, babs),
    diff = v - Math.min(rabs, gabs, babs);
    diffc = c => (v - c) / 6 / diff + 1 / 2;
    percentRoundFn = num => Math.round(num * 100) / 100;
    if (diff == 0) {
        h = s = 0;
    } else {
        s = diff / v;
        rr = diffc(rabs);
        gg = diffc(gabs);
        bb = diffc(babs);

        if (rabs === v) {
            h = bb - gg;
        } else if (gabs === v) {
            h = (1 / 3) + rr - bb;
        } else if (babs === v) {
            h = (2 / 3) + gg - rr;
        }
        if (h < 0) {
            h += 1;
        }else if (h > 1) {
            h -= 1;
        }
    }
    return {
        h: Math.round(h * 360),
        s: percentRoundFn(s * 100),
        v: percentRoundFn(v * 100)
    };
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
