// @ts-check

import * as cornerstone from "@cornerstonejs/core";
import * as cornerstoneWadoImageLoader from "cornerstone-wado-image-loader";
import * as dicomParser from "dicom-parser";

cornerstoneWadoImageLoader.external.cornerstone = cornerstone;
cornerstoneWadoImageLoader.external.dicomParser = dicomParser;

cornerstone.metaData.addProvider((type, imageId) => {
  const parsedImageId =
    cornerstoneWadoImageLoader.wadouri.parseImageId(imageId);
  const dataSet = cornerstoneWadoImageLoader.wadouri.dataSetCacheManager.get(
    parsedImageId.url
  );
  if (!dataSet) {
    return;
  }
  if (type === "multiFrameModule") {
    return {
      numberOfFrames: dataSet.intString("x00280008"),
    };
  }
});
/** @type {import("@cornerstonejs/core/dist/esm/types").IStackViewport} */
let viewport;

const element = document.getElementById("cornerstone");

document.getElementById("selectFile").addEventListener("change", function (e) {
  // Add the file to the cornerstoneFileImageLoader and get unique
  // number for that file
  const file = e.target.files[0];
  const imageId = cornerstoneWadoImageLoader.wadouri.fileManager.add(file);
  loadAndViewImage(imageId);
});

document.getElementById("frame").addEventListener("change", function (e) {
  viewport.setImageIdIndex(e.target.value);
});

/**
 * Runs the demo
 */
async function run() {
  // Init Cornerstone and related libraries
  await cornerstone.init();

  // Define a tool group, which defines how mouse events map to tool commands for
  // Any viewport using the group

  // Get Cornerstone imageIds and fetch metadata into RAM

  // Instantiate a rendering engine
  const renderingEngineId = "myRenderingEngine";
  const renderingEngine = new cornerstone.RenderingEngine(renderingEngineId);

  // Create a stack viewport
  const viewportId = "CT_STACK";
  const viewportInput = {
    viewportId,
    type: cornerstone.Enums.ViewportType.STACK,
    element,
  };

  renderingEngine.enableElement(viewportInput);

  // Get the stack viewport that was created
  viewport = renderingEngine.getViewport(viewportId);
}
run();

async function loadAndViewImage(imageId) {
  await cornerstone.imageLoader.loadImage(imageId);
  const multiFrameModule = cornerstone.metaData.get(
    "multiFrameModule",
    imageId
  );
  let stack = [];
  if (multiFrameModule?.numberOfFrames > 0) {
    for (let i = 0; i < multiFrameModule.numberOfFrames; i++) {
      stack.push(imageId + `?frame=${i}`);
    }
  } else {
    stack = [imageId];
  }

  // Set the stack on the viewport
  viewport.setStack(stack).then(() => {
    // Set the VOI of the stack
    // viewport.setProperties({ voiRange: ctVoiRange });
    // Render the image
    viewport.render();
  });
}
