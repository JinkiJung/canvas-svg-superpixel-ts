import { Annotation, AnnotationTag, number2SPId } from "./superpixelCanvas";
const Snap = require("snapsvg-cjs");

const defaultAnnotation = (id: number) => new Annotation(AnnotationTag.EMPTY, AnnotationTag.EMPTY, id);

export const annotateCanvas = (annotatedData: Annotation[], defaultColor: string, defaultOpacity: number,
    defaultLineWidth: number, annotatedOpacity: number ) => {
    if (annotatedData){
        annotatedData.map( (annotation: Annotation) => {
            const key = annotation.index!;
            const superpixel = Snap("#" + number2SPId(key));
            superpixel.attr({ id: number2SPId(key), key, stroke: "white", strokeWidth: defaultLineWidth,
            fill: annotation.color === AnnotationTag.EMPTY ? defaultColor : annotation.color,
            opacity: annotation.tag === AnnotationTag.EMPTY ? defaultOpacity : annotatedOpacity,
            tag: annotation.tag,
            name: annotation.color,
            });
        })
    }
}