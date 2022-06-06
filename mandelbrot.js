const canvas = document.getElementById("m-set__canvas");
const ctx = canvas.getContext('2d');

const {width, height} = canvas;
const center = {x: width / 2, y: height / 2};

const scale = 250;
const accuracy = 100;

const defineRange = function* (stepX, stepY) {
    let x = 0;
    let y = 0;
    while (x <= width && y <= height && x >= -width && y >= -height) {
        if (x / width === stepX) {
            x = 0;
            y += stepY;
        }
        x += stepX;
        yield {x, y};
    }
}

const addZ = point => {
    const arr = [point];
    for (let i = 0; i < accuracy; i++) {
        let x = Math.pow(arr[i].x, 2) - Math.pow(arr[i].y, 2) + arr[0].x;
        let y = 2 * arr[i].x * arr[i].y + arr[0].y;
        if ((x === 0 && y === 0) || !isFinite(x) || !isFinite(y)) {
            break;
        } else {
            arr.push({x, y});
        }
    }
    return {...point, z: arr};
}

const isBelongsToSet = ({x, y}) => Math.pow(x, 2) + Math.pow(y, 2) > 4;

const pixelIndex = (x, y) => y * width * 4 + x * 4;

const pixelColor = color => Math.abs(color) % 255;

const setPixel = (data, point) => {
    let x = (point.x * scale + center.x).toFixed();
    let y = (point.y * scale + center.y).toFixed();
    let i = point.z.length;
    let topIndex = pixelIndex(x, y);
    let bottomIndex = pixelIndex(x, height - y);
    let red = pixelColor(i * 3);
    let green = pixelColor(i * 6);
    let blue = pixelColor(i * 9);
    data[topIndex] = red;
    data[bottomIndex] = red;
    data[++topIndex] = green;
    data[++bottomIndex] = green;
    data[++topIndex] = blue;
    data[++bottomIndex] = blue;
    data[++topIndex] = 255;
    data[++bottomIndex] = 255;
    return data;
}

const render = () => {
    return new Promise(resolve => {
        const imageData = ctx.createImageData(width, height);
        const left = defineRange(-1, -1);
        const right = defineRange(1, -1);
        let nextLPoint = left.next();
        let nextRPoint = right.next();
        for (; !nextLPoint.done || !nextRPoint.done; nextLPoint = left.next(), nextRPoint = right.next()) {
            let leftPoint = addZ({x: nextLPoint.value.x / (scale * 2), y: nextLPoint.value.y / (scale * 2)});
            let rightPoint = addZ({x: nextRPoint.value.x / (scale * 2), y: nextRPoint.value.y / (scale * 2)});
            if (isBelongsToSet(leftPoint.z[leftPoint.z.length - 1])) {
                imageData.data = setPixel(imageData.data, leftPoint);
            }
            if (isBelongsToSet(rightPoint.z[rightPoint.z.length - 1])) {
                imageData.data = setPixel(imageData.data, rightPoint);
            }
        }
        ctx.putImageData(imageData, 0, 0);
        return resolve(imageData);
    });
}

render().then(() => console.log("Done!"));