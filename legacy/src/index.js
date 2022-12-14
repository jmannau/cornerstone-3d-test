// @ts-check

import * as cornerstone from "cornerstone-core";
import cornerstoneMaths from "cornerstone-math";
import * as cornerstoneTools from "cornerstone-tools";
import * as cornerstoneWadoImageLoader from "cornerstone-wado-image-loader";
import * as dicomParser from "dicom-parser";
import Hammer from "hammerjs";

cornerstoneWadoImageLoader.external.cornerstone = cornerstone;
cornerstoneWadoImageLoader.external.dicomParser = dicomParser;

cornerstoneTools.external.cornerstone = cornerstone;
cornerstoneTools.external.Hammer = Hammer;
cornerstoneTools.external.cornerstoneMath = cornerstoneMaths;

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
  const scroll = cornerstoneTools.import("util/scrollToIndex");
  scroll(element, e.target.value);
});

/**
 * Runs the demo
 */
async function run() {
  // Init Cornerstone and related libraries

  // Define a tool group, which defines how mouse events map to tool commands for
  // Any viewport using the group

  // Get Cornerstone imageIds and fetch metadata into RAM

  // Instantiate a rendering engine
  cornerstone.enable(element);
  cornerstoneTools.init();
  cornerstoneTools.addStackStateManager(element, ["stack", "playClip"]);
  cornerstoneTools.addStackStateManager(element, [
    "stack",
    "playClip",
    "referenceLines",
  ]);
}
run();

async function loadAndViewImage(imageId) {
  const image = await cornerstone.loadImage(imageId);
  const multiFrameModule = cornerstone.metaData.get(
    "multiFrameModule",
    imageId
  );
  cornerstone.displayImage(element, image);
  let stack = [];
  if (multiFrameModule?.numberOfFrames > 0) {
    for (let i = 0; i < multiFrameModule.numberOfFrames; i++) {
      stack.push(imageId + `?frame=${i}`);
    }
  } else {
    stack = [imageId];
  }

  cornerstoneTools.addToolState(element, "stack", {
    imageIds: stack,
    currentImageIdIndex: 0,
  });
  cornerstoneTools.stackPrefetch.enable(element, {
    preserveExistingPool: false,
  });
}
