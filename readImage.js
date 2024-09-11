function readImage(file) {
  const reader = new FileReader();

  reader.onload = function (e) {
    const img = new Image();
    img.src = e.target.result;

    // Create a canvas element to manipulate the image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = function () {
      // Set the canvas dimensions to match the image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw the image onto the canvas
      ctx.drawImage(img, 0, 0);

      // Convert the canvas to a PNG image
      const pngData = canvas.toDataURL('image/png');

      // Set the PNG image as the source of the <img> element
      document.getElementById('imagePreview').src = pngData;
    };
  };

  reader.readAsDataURL(file);
}

// Assuming you have an input file element with the ID "imageFile"
document.getElementById('imageFile').addEventListener('change', function (e) {
  const file = e.target.files[0];
  readImage(file);
});