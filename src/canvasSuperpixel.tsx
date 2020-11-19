import React, { useRef, useState } from "react";
import { Annotation } from "./superpixel";
import { Superpixel } from "./superpixel";
const svgToPng = require("save-svg-as-png");

let keys :number[] = [];

const getAnnotationData = (key: number, array: Annotation[], defaultAnnotating: Annotation): Annotation => {
    for (let e of array) {
        if (e.index === key) return { tag: e.tag, color: e.color };
      }
    return defaultAnnotating;
  }

interface CanvasSuperpixelProps {
  keyId: string,
  fileName: string,
  segmentationData: any,
  width: number,
  height: number,
  defaultcolor: string,
  colorbuttons: string[],
  annotationData: Annotation[],
}

export const CanvasSuperpixel: React.FC<CanvasSuperpixelProps> = ({ keyId, fileName, segmentationData, width, height, defaultcolor, colorbuttons, annotationData }) => {
  const canvasRef = useRef<SVGSVGElement>(null);

  const updateAnnotating = (tag: number, color: string) => {
    //setAnnotating({ tag: index, color: color }); // computationally intensive requiring re-rendering
    canvasRef.current?.setAttribute("name", tag.toString());
    canvasRef.current?.setAttribute("color-profile", color);
  }

  const exportToPng = () => {
    let fileNameSplit = fileName.split("/");
    let file = fileNameSplit[fileNameSplit.length - 1];
    svgToPng.saveSvgAsPng(canvasRef.current, file.split(".")[0] + ".png", {backgroundColor: "#000000"});
  }

  const [ annotating ] = useState(new Annotation(-1, defaultcolor));
  if (keys.length === 0) for (let k in segmentationData) keys.push(parseInt(k));
  const viewBoxString = [0, 0, width, height].join(" ");
  const annotatedIndices = annotationData.map((element) => element.index);
  return (
    <div>
      <div className="coloring-buttons">
        {colorbuttons.map((color, tag) => (
          <button
            key={tag}
            onClick={() => updateAnnotating(tag, color)}
          >
            {color}
          </button>
        ))}
        <button className="export-button" onClick={exportToPng}>export</button>
      </div>
      <div className="img-overlay-wrap">
        <img src={fileName} width={width} height={height} alt={"test"} />
        <svg
          ref = {canvasRef}
          id={keyId}
          viewBox={viewBoxString}
          name={annotating.tag.toString()}
          colorProfile={annotating.color}
        >
          {
          keys.map((key) => {
            const initialAnnotation = annotatedIndices.includes(key)
              ? getAnnotationData(key, annotationData, annotating) : annotating;
            return <Superpixel
              keyId={key}
              pixels={segmentationData[String(key)].split(",")}
              canvasWidth={width}
              canvasHeight={height}
              initialAnnotation={initialAnnotation}
              defaultcolor = {defaultcolor}
              key={key}
            />;
          })}
        </svg>
      </div>
    </div>
  );
};
