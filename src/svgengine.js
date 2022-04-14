"use strict";

const path = require("path");
const isLocal = typeof process.pkg === "undefined";
const basePath = isLocal ? process.cwd() : path.dirname(process.execPath);
const fs = require("fs");
const { format } = require(path.join(basePath, "/src/config.js"));
var JSSoup = require("jssoup").default;

const validChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

const generateString = (length) => {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += validChars.charAt(Math.floor(Math.random() * validChars.length));
  }

  return result;
};

const generateId = (length = 6) => generateString(length);

var svg_buffer = "";
const svg_header = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="none" x="0px" y="0px" width="${format.width}px" height="${format.height}px" viewBox="0 0 ${format.width} ${format.height}">`;
const svg_footer = "</svg>";

const ImageEngine = {
  getImageBuffer: () => {
    var svg_image = svg_header + svg_buffer + svg_footer;
    return svg_image;
  },

  drawBackground: () => {},

  drawElement: (_renderObject, _index, _layersLen, colors) => {
    var svg_layer = _renderObject.loadedImage;
    const group = _renderObject.layer.group;
    const fill = colors[group].fill;
    const stroke = colors[group].stroke;
    // TODO throw misconfiguration error if layer has no group

    // remove svg headers
    var soup = new JSSoup(svg_layer, false);

    var svg_data = soup.find("svg");
    const id = generateId();
    const defs = soup.find("defs");
    const style = defs && defs.find("style");
    if (defs) {
      if (style) {
        let newStyle = `${style.string.toString()}`;

        // Replace all existing fill and stroke values
        // if (fill) {
        //   newStyle = `${newStyle.replaceAll(
        //     /fill([^;]*);*/g,
        //     `fill:${fill};`
        //   )}`;
        // }
        // if (stroke) {
        //   newStyle = `${newStyle.replaceAll(
        //     /stroke([^;]*);*/g,
        //     `stroke:${stroke};`
        //   )}`;
        // }

        // Prefix existing style rules with ID
        newStyle = newStyle
          .split(".")
          .map((el) => {
            if (el.includes("}")) {
              return `#${id} .${el}`;
            }
            return `${el}`;
          })
          .join("");

        // Add new fill and stroke for rect, path, ellipse, polygon, prefixed with ID
        if (fill && stroke) {
          newStyle = `${newStyle}#${id} rect,#${id} path,#${id} ellipse,#${id} polygon{fill:${fill};stroke:${stroke};}`;
        } else if (fill) {
          newStyle = `${newStyle}#${id} rect,#${id} path,#${id} ellipse,#${id} polygon{fill:${fill};}`;
        } else if (stroke) {
          newStyle = `${newStyle}#${id} rect,#${id} path,#${id} ellipse,#${id} polygon{stroke:${stroke};}`;
        }

        newStyle = `<style>${newStyle}</style>`;

        // Replaces all fill and stroke with chosen fill and stroke
        // If either fill or stroke doesn't exist for each rule, adds fill and/or stroke to that rule
        // newStyle = newStyle.split("{")
        // .map((el) => {
        //   if (el.includes("}")) {
        //     if (!el.includes("fill") && fill) {
        //       el = `fill:${fill};${el}`;
        //     }
        //     if (!el.includes("stroke") && stroke) {
        //       el = `stroke:${stroke};${el}`;
        //     }
        //     return `{${el}`;
        //   }
        //   return `${el}`;
        // })
        // .join("")
        style.replaceWith(new JSSoup(newStyle));
      } else {
        defs.insert(
          0,
          new JSSoup(`<style>*{fill:${fill};stroke:${stroke};}</style>`)
        );
      }
    } else {
      svg_data.insert(
        0,
        new JSSoup(
          `<defs><style>*{fill:${fill};stroke:${stroke};}</style></defs>`
        )
      );
    }

    // Wrap all shapes in a <g> tag with ID
    const defsIndex = svg_data.contents.findIndex((el) => el.name === "defs");
    svg_data.insert(defsIndex + 1, new JSSoup(`<g id="${id}"></g>`));
    const newly_added_g = svg_data.find(`g`);
    newly_added_g.insert(0, new JSSoup(newly_added_g.nextSiblings.toString()));
    newly_added_g.nextSiblings.forEach((el) => {
      el.extract();
    });
    svg_buffer += svg_data;
  },

  clearRect: () => {
    svg_buffer = "";
  },

  loadImage: (_layer) => {
    return new Promise((resolve) => {
      fs.readFile(
        `${_layer.selectedElement.path}`,
        "utf8",
        function (err, buffer) {
          resolve(buffer);
        }
      );
    });
  },
};

module.exports = { ImageEngine };
