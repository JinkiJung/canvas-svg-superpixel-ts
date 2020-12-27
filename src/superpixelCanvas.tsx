import { annotateCanvas } from "./canvasAnnotator";
import { updateSVGEvent } from "./canvasEventLinker";
import { CanvasSVGCreator } from "./canvasSVGCreator";

const React = require("react");
const { useState, useEffect } = require("react");
const Snap = require("snapsvg-cjs");
const svgToPng = require("save-svg-as-png");

const fileName = "./resource/20200924_094945.jpg.svg";

export enum AnnotationTag{
  EMPTY = "empty",
  DEANNOTATING = "deannotating",
}

export interface ITag {
  tag: string;
  superpixelId: number;
  area: number;
}

const defaultOpacity = 0.1;
const annotatedOpacity = 0.7;
const annotatingOpacity = 0.9;
const defaultLineWidth = 0;
const highlightLineWidth = 2;
const canvasContainerId = "canvasContainer";

export interface IPoint{
    x: number,
    y: number,
}

export interface IAnnotation{
    tag: string,
    color: string,
    index?: number,
}

export interface ICoordinates{
    gridWidth: number, 
    gridHeight: number, 
    canvasWidth: number, 
    canvasHeight: number,
}

export class Annotation implements IAnnotation {
    tag: string
    color: string
    index?: number

    constructor(tag: string, color: string, index?:number){
        this.tag = tag;
        this.color = color;
        this.index = index;
    }
}

export const updateAnnotating = (canvasId: string, tag: string, color:string) => {
    document.getElementById(canvasId)?.setAttribute("name", color);
    document.getElementById(canvasId)?.setAttribute("color-profile", tag);
  }

export const number2SPId = (id: number): string => {
    return "sp" + id.toString();
}

export const SPId2number = (spId: string): number => {
    return spId.startsWith("sp") ? parseInt(spId.substr(2)) : -1;
}

export const exportToPng = (canvasId: string, fileName: string, backgroundColor: string = "#000000", callback?: (fileName: string, content: string) => any) => {
    let fileNameSplit = fileName.split("/");
    let finalFileName = fileNameSplit[fileNameSplit.length - 1].split(".")[0] + ".png";

    if (callback){
        svgToPng.svgAsPngUri(document.getElementById(canvasId),
        finalFileName, {backgroundColor: backgroundColor}).then((uri: string) => callback(finalFileName, uri));
    } else {
        svgToPng.saveSvgAsPng(document.getElementById(canvasId), finalFileName, {backgroundColor: backgroundColor})
    }
}

export const exportToSvg = (id: string, fileName: string, callback?: (fileName: string, content: string) => any) => {
    let fileNameSplit = fileName.split("/");
    let finalFileName = fileNameSplit[fileNameSplit.length - 1].split(".")[0] + ".svg";

    if (callback){
        const uri = "data:image/svg+xml;utf8,"+ document.getElementById(id)?.outerHTML!;
        callback(finalFileName, uri);
    } else {
        console.log(document.getElementById(id)?.outerHTML!);
    }
}

export const getSvgUrl = (canvasId:string): string => {
    const content = document.getElementById(canvasId)?.outerHTML!;
    var file = new Blob([content], { type: 'image/svg+xml' });
    return URL.createObjectURL(file);
}

interface SuperpixelCanvasProps {
    id: string, canvasWidth: number, canvasHeight: number, segmentationData: any,
     annotatedData: Annotation[], defaultColor: string,
     onSegmentsUpdated: (...params: any[]) => void, onSelectedTagUpdated: (...params: any[]) => void,
     onCanvasLoaded: (...params: any[]) => void;
}

export const SuperpixelCanvas: React.FC<SuperpixelCanvasProps> = 
({id, canvasWidth, canvasHeight, segmentationData, annotatedData, defaultColor,
     onSegmentsUpdated, onSelectedTagUpdated, onCanvasLoaded}) => {
    const [ loaded, setLoaded ] = useState(false);
    const [ svgNotExist, setSvgNotExist ] = useState(false);

    const onSVGLoaded = (data: any, test:any) => { 
        const s = Snap("#" + canvasContainerId);
        if (data.node.nodeName === 'svg'){  // load success
            if (s.select("path") === null){
                s.append( data );
                setLoaded(true);
            }
        }        
        else{
            setSvgNotExist(true);
        }
    }

    const onCanvasSVGCreated = () => {
        setLoaded(true);
    }

    useEffect( () => {
        async function loadSVG(fileName: string) {
            await Snap.load(fileName, onSVGLoaded);
        };
        
        if (!loaded && !svgNotExist){
            loadSVG(fileName);
        }
        else if (loaded){
            var s = Snap("#" + id);
            if (s && s.selectAll("path").length){
                updateSVGEvent(canvasContainerId, id, defaultColor, defaultOpacity, annotatedOpacity, defaultLineWidth,
                    annotatingOpacity, highlightLineWidth, onSegmentsUpdated, onSelectedTagUpdated,);
                annotateCanvas(annotatedData, defaultColor, defaultOpacity, defaultLineWidth, annotatedOpacity);
                onCanvasLoaded();
            }
        }
    }, [loaded, svgNotExist]);

    return (
        <div id={canvasContainerId}>{ 
            svgNotExist && 
            <CanvasSVGCreator id={id} canvasWidth={canvasWidth} canvasHeight={canvasHeight} segmentationData={segmentationData} defaultColor={defaultColor} defaultOpacity={defaultOpacity} defaultLineWidth={defaultLineWidth} onCanvasSVGCreated={onCanvasSVGCreated} />
        }</div>
        );
}

export const getBoundingBox = (canvasId: string, ids: number[]) => {
    let pathString = "";
    ids.forEach( (id) => {const s = document.getElementById("sp"+id)!; pathString += (s.getAttribute("d") + " ") });
    const s = Snap("#"+canvasId);
    const path = s.path(pathString);
    //path.attr( {visibility: "hidden"} );
    const bbox = path.getBBox();
    path.remove();
    return { left: bbox.x, top: bbox.y, width: bbox.width, height: bbox.height };
}

export const clearEditor = (canvasId: string, defaultcolor: string) => {
    const s = Snap("#"+canvasId);
    const paths = s.selectAll('path');
    paths.forEach(function(element: Snap.Set){
        const e = element.attr;
        element.attr({...e, name: AnnotationTag.EMPTY, tag: AnnotationTag.EMPTY, fill: defaultcolor, style: "stroke-width: 1; opacity: 0.1;",});
    }, this);
}

