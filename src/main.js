const fs = require("fs");
const BASEDIR = process.cwd();
const { FOLDERS } = require(`${BASEDIR}/constants/folders.js`);
const sha1 = require(`${FOLDERS.nodeModulesDir}/sha1`);
const { createCanvas, loadImage } = require(`${FOLDERS.nodeModulesDir}/canvas`);
const { NETWORK } = require(`${FOLDERS.constantsDir}/network.js`);
const { NFT_DETAILS } = require(`${FOLDERS.constantsDir}/nft_details.js`);
const path = require("path");
const {
  format,
  background,
  uniqueDnaTorrance,
  layerConfigurations,
  rarityDelimiter,
  shuffleLayerConfigurations,
  debugLogs,
  extraMetadata,
  text,
  network,
  solanaMetadata,
  gif,
  IMG_FORMAT,
  paletteGroups,
  palettes: availablePalettes,
} = require(`${FOLDERS.sourceDir}/config.js`);
const { chooseColors } = require("./colors");
const canvas = createCanvas(format.width, format.height);
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = format.smoothing;
var metadataList = [];
var attributesList = [];
var dnaList = new Set();
const DNA_DELIMITER = "-";
const HashlipsGiffer = require(`${FOLDERS.modulesDir}/HashlipsGiffer.js`);

//Image format support - supported values "png", "svg"
const PNG_FORMAT = "png";
const SVG_FORMAT = "svg";

const layersDir =
  IMG_FORMAT == PNG_FORMAT
    ? path.join(BASEDIR, "/layers")
    : path.join(BASEDIR, "/layers_svgs");
const { ImageEngine } =
  IMG_FORMAT == PNG_FORMAT
    ? require(path.join(BASEDIR, "/src/pngengine.js"))
    : require(path.join(BASEDIR, "/src/svgengine.js"));

//IMG_FORMAT Specific constants
const Image_uri = IMG_FORMAT == PNG_FORMAT ? "image.png" : "image.svg";
const Image_type = IMG_FORMAT == PNG_FORMAT ? "image.png" : "image/svg";
const Image_extension = IMG_FORMAT == PNG_FORMAT ? "png" : "svg";

console.log("Using Image format: " + IMG_FORMAT);

const { needsFiltration } = require("./filters");
const {
  combinationOfTraitsAlreadyExists,
} = require("./filters/combination_traits");

let hashlipsGiffer = null;

const buildSetup = () => {
  if (fs.existsSync(FOLDERS.buildDir)) {
    fs.rmSync(FOLDERS.buildDir, { recursive: true });
  }
  fs.mkdirSync(FOLDERS.buildDir);
  fs.mkdirSync(FOLDERS.jsonDir);
  fs.mkdirSync(FOLDERS.imagesDir);
  if (gif.export) {
    fs.mkdirSync(FOLDERS.gifsDir);
  }
};

const getRarityWeight = (_str) => {
  let nameWithoutExtension = _str.slice(0, -4);
  var nameWithoutWeight = Number(
    nameWithoutExtension.split(rarityDelimiter).pop()
  );
  if (isNaN(nameWithoutWeight)) {
    nameWithoutWeight = 1;
  }
  return nameWithoutWeight;
};

const cleanDna = (_str) => {
  const withoutOptions = removeQueryStrings(_str);
  var dna = Number(withoutOptions.split(":").shift());
  return dna;
};

const cleanName = (_str) => {
  let nameWithoutExtension = _str.slice(0, -4);
  var nameWithoutWeight = nameWithoutExtension.split(rarityDelimiter).shift();
  return nameWithoutWeight;
};

const getElements = (path) => {
  return fs
    .readdirSync(path)
    .filter((item) => !/(^|\/)\.[^\/\.]/g.test(item))
    .map((i, index) => {
      if (i.includes(DNA_DELIMITER)) {
        throw new Error(
          `layer name can not contain "${DNA_DELIMITER}" characters, please fix: ${i}`
        );
      }
      return {
        id: index,
        name: cleanName(i),
        filename: i,
        path: `${path}${i}`,
        weight: getRarityWeight(i),
      };
    });
};

const layersSetup = (layersOrder) => {
  const layers = layersOrder.map((layerObj, index) => ({
    id: index,
    elements: getElements(`${layersDir}/${layerObj.name}/`),
    name:
      layerObj.options?.["displayName"] != undefined
        ? layerObj.options?.["displayName"]
        : layerObj.name,
    maxRepeatedTrait: layerObj.maxRepeatedTrait,
    layerItemsMaxRepeatedTrait: layerObj.layerItemsMaxRepeatedTrait,
    blend:
      layerObj.options?.["blend"] != undefined
        ? layerObj.options?.["blend"]
        : "source-over",
    opacity:
      layerObj.options?.["opacity"] != undefined
        ? layerObj.options?.["opacity"]
        : 1,
    bypassDNA:
      layerObj.options?.["bypassDNA"] !== undefined
        ? layerObj.options?.["bypassDNA"]
        : false,
    ...(layerObj.group ? { group: layerObj.group } : {}),
  }));
  return layers;
};

const saveImage = (_editionCount) => {
  fs.writeFileSync(
    `${FOLDERS.imagesDir}/${_editionCount}.${Image_extension}`,
    ImageEngine.getImageBuffer()
  );
};

const genColor = () => {
  let hue = Math.floor(Math.random() * 360);
  let pastel = `hsl(${hue}, 100%, ${background.brightness})`;
  return pastel;
};

const drawBackground = () => {
  ctx.fillStyle = genColor();
  //ctx.fillStyle = background.static ? background.default : genColor();
  ctx.fillRect(0, 0, format.width, format.height);
};

const addMetadata = (_dna, _edition) => {
  let dateTime = Date.now();
  let tempMetadata = {
    name: `${NFT_DETAILS.namePrefix} #${_edition}`,
    description: `${NFT_DETAILS.description}`,
    file_url: `${NFT_DETAILS.imageFilesBase}/${_edition}.${Image_extension}`,
    image: `${NFT_DETAILS.imageFilesBase}/${_edition}.${Image_extension}`,
    attributes: attributesList,
    custom_fields: {
      dna: sha1(_dna),
      edition: _edition,
      date: dateTime,
      compiler: "HashLips Art Engine - Modified By ThePeanutGalleryAndCo",
    },
    ...extraMetadata,
  };
  if (network == NETWORK.sol) {
    tempMetadata = {
      //Added metadata for solana
      name: tempMetadata.name,
      symbol: solanaMetadata.symbol,
      description: tempMetadata.description,
      //Added metadata for solana
      seller_fee_basis_points: solanaMetadata.seller_fee_basis_points,
      image: `${_edition}.${Image_extension}`,
      //Added metadata for solana
      external_url: solanaMetadata.external_url,
      edition: _edition,
      ...extraMetadata,
      attributes: tempMetadata.attributes,
      properties: {
        files: [
          {
            uri: Image_uri,
            type: Image_type,
          },
        ],
        category: "image",
        creators: solanaMetadata.creators,
      },
      custom_fields: {
        dna: sha1(_dna),
        edition: _edition,
        date: dateTime,
        compiler: "HashLips Art Engine",
      },
    };
  }
  metadataList.push(tempMetadata);
  attributesList = [];
};

const addAttributes = (_element, colors) => {
  let selectedElement = _element.layer.selectedElement;

  //Added ability for user to state whether they are using blank images or blank keyword within image names so that the code can already cater for it as the norm is to remove blanks from attribute lists.
  if (NFT_DETAILS.ignoreAllNamesWithBlank) {
    if (!selectedElement.name.trim().toLowerCase().includes("blank")) {
      addToAttrbutesList(_element.layer.name, selectedElement.name, colors);
    }
  } else if (NFT_DETAILS.ignoreExactBlankName) {
    if (selectedElement.name.trim().toLowerCase() !== "blank") {
      addToAttrbutesList(_element.layer.name, selectedElement.name, colors);
    }
  } else {
    addToAttrbutesList(_element.layer.name, selectedElement.name, colors);
  }
};

function addToAttrbutesList(_layerName, _elementValue) {
  attributesList.push({
    trait_type: _layerName,
    value: _elementValue,
  });
}

const loadLayerImg = async (_layer) => {
  try {
    const image = await ImageEngine.loadImage(_layer);
    return {
      layer: _layer,
      loadedImage: image,
    };
  } catch (error) {
    console.error("Error loading image:", error);
  }
};

const addText = (_sig, x, y, size) => {
  ctx.fillStyle = text.color;
  ctx.font = `${text.weight} ${size}pt ${text.family}`;
  ctx.textBaseline = text.baseline;
  ctx.textAlign = text.align;
  ctx.fillText(_sig, x, y);
};

const drawElement = (_renderObject, _index, _layersLen, colors) => {
  ImageEngine.drawElement(_renderObject, _index, _layersLen, colors);

  addAttributes(_renderObject, colors);
};

const constructLayerToDna = (_dna = "", _layers = []) => {
  let mappedDnaToLayers = _layers.map((layer, index) => {
    let selectedElement = layer.elements.find(
      (e) => e.id == cleanDna(_dna.split(DNA_DELIMITER)[index])
    );
    return {
      name: layer.name,
      blend: layer.blend,
      opacity: layer.opacity,
      group: layer.group,
      selectedElement: selectedElement,
    };
  });
  return mappedDnaToLayers;
};

/**
 * In some cases a DNA string may contain optional query parameters for options
 * such as bypassing the DNA isUnique check, this function filters out those
 * items without modifying the stored DNA.
 *
 * @param {String} _dna New DNA string
 * @returns new DNA string with any items that should be filtered, removed.
 */
const filterDNAOptions = (_dna) => {
  const dnaItems = _dna.split(DNA_DELIMITER);
  const filteredDNA = dnaItems.filter((element) => {
    const query = /(\?.*$)/;
    const querystring = query.exec(element);
    if (!querystring) {
      return true;
    }
    const options = querystring[1].split("&").reduce((r, setting) => {
      const keyPairs = setting.split("=");
      return { ...r, [keyPairs[0]]: keyPairs[1] };
    }, []);

    return options.bypassDNA;
  });

  return filteredDNA.join(DNA_DELIMITER);
};

/**
 * Cleaning function for DNA strings. When DNA strings include an option, it
 * is added to the filename with a ?setting=value query string. It needs to be
 * removed to properly access the file name before Drawing.
 *
 * @param {String} _dna The entire newDNA string
 * @returns Cleaned DNA string without querystring parameters.
 */
const removeQueryStrings = (_dna) => {
  const query = /(\?.*$)/;
  return _dna.replace(query, "");
};

const isDnaUnique = (_DnaList = new Set(), _dna = "") => {
  const _filteredDNA = filterDNAOptions(_dna);
  return !_DnaList.has(_filteredDNA);
};

const selectTraits = (layers) => {
  let traits = [];
  layers.forEach((layer) => {
    var totalWeight = 0;
    layer.elements.forEach((element) => {
      totalWeight += element.weight;
    });
    // number between 0 - totalWeight
    let random = Math.floor(Math.random() * totalWeight);
    for (var i = 0; i < layer.elements.length; i++) {
      // subtract the current weight from the random weight until we reach a sub zero value.
      random -= layer.elements[i].weight;
      if (random < 0) {
        return traits.push({
          layer: layer.name,
          id: layer.elements[i].id,
          name: layer.elements[i].name,
          filename: layer.elements[i].filename,
          bypassDNA: layer.bypassDNA,
          maxRepeatedTrait: layer.maxRepeatedTrait,
          layerItemsMaxRepeatedTrait: layer.layerItemsMaxRepeatedTrait
        });
      }
    }
  });
  return traits;
};

const createDna = (traits, colors = {}) => {
  let dna = [];

  traits.forEach((trait) => {
    dna.push(
      `${trait.id}:${trait.filename}${trait.bypassDNA ? "?bypassDNA=true" : ""}`
    );
  });

  Object.entries(colors).forEach(([k, v]) => {
    dna.push(
      `${k}{${v.fill ? "fill:" + v.fill + ";" : ""}${
        v.stroke ? "stroke:" + v.stroke + ";" : ""
      }}`
    );
  });

  return dna.join(DNA_DELIMITER);
};

const writeMetaData = (_data) => {
  fs.writeFileSync(`${FOLDERS.jsonDir}/_metadata.json`, _data);
};

const saveMetaDataSingleFile = (_editionCount) => {
  let metadata = metadataList.find(
    (meta) => meta.custom_fields.edition == _editionCount
  );
  debugLogs
    ? console.log(
        `Writing metadata for ${_editionCount}: ${JSON.stringify(metadata)}`
      )
    : null;
  fs.writeFileSync(
    `${FOLDERS.jsonDir}/${_editionCount}.json`,
    JSON.stringify(metadata, null, 2)
  );
};

function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}

const startCreating = async () => {
  let layerConfigIndex = 0;
  let editionCount = 1;
  let failedCount = 0;
  let abstractedIndexes = [];
  const _startCollectionEditionFrom = Number(
    NFT_DETAILS.startCollectionEditionFrom
  );
  for (
    let i =
      network == NETWORK.sol
        ? _startCollectionEditionFrom > 1
          ? _startCollectionEditionFrom
          : 0
        : NFT_DETAILS.startCollectionEditionFrom === "0"
        ? 0
        : _startCollectionEditionFrom
        ? _startCollectionEditionFrom
        : 1;
    i <=
    layerConfigurations[layerConfigurations.length - 1].growEditionSizeTo +
      (_startCollectionEditionFrom > 1 && _startCollectionEditionFrom);
    i++
  ) {
    abstractedIndexes.push(i);
  }
  if (shuffleLayerConfigurations) {
    abstractedIndexes = shuffle(abstractedIndexes);
  }
  debugLogs
    ? console.log("Editions left to create: ", abstractedIndexes)
    : null;
  while (layerConfigIndex < layerConfigurations.length) {
    const selectedTraitsList = new Set();
    const layers = layersSetup(
      layerConfigurations[layerConfigIndex].layersOrder
    );
    while (
      editionCount <= layerConfigurations[layerConfigIndex].growEditionSizeTo
    ) {
      let colors;

      if (IMG_FORMAT === SVG_FORMAT) {
        colors = chooseColors(paletteGroups, availablePalettes);

        Object.entries(colors).forEach(([k, v]) => {
          Object.entries(v).forEach(([ik, iv]) => {
            attributesList.push({
              trait_type: `${k} ${ik}`,
              value: iv,
            });
          });
        });
      }

      const traits = selectTraits(layers);
      let newDna = createDna(traits, colors);
      if (isDnaUnique(dnaList, newDna)) {
        const maxRepeatedTraits =
          layerConfigurations[layerConfigIndex].maxRepeatedTraits;
        const incompatibleTraits =
          layerConfigurations[layerConfigIndex].incompatibleTraits;
        const layerItemsMaxRepeatedTraits =
          layerConfigurations[layerConfigIndex].layerItemsMaxRepeatedTraits;
        const dependentTraits =
          layerConfigurations[layerConfigIndex].dependentTraits;

        if (
          needsFiltration(
            selectedTraitsList,
            traits,
            maxRepeatedTraits,
            incompatibleTraits,
            layerItemsMaxRepeatedTraits,
            dependentTraits
          )
        ) {
          failedCount++;
          if (failedCount >= uniqueDnaTorrance) {
            console.log(
              `You need more layers or elements to grow your edition to ${layerConfigurations[layerConfigIndex].growEditionSizeTo} artworks!`
            );
            writeMetaData(JSON.stringify(metadataList, null, 2));
            process.exit();
          }
          continue;
        }

        let results = constructLayerToDna(newDna, layers);
        let loadedElements = [];

        results.forEach((layer) => {
          loadedElements.push(loadLayerImg(layer));
        });

        await Promise.all(loadedElements).then((renderObjectArray) => {
          debugLogs ? console.log("Clearing canvas") : null;
          ImageEngine.clearRect();
          ctx.clearRect(0, 0, format.width, format.height);

          let colors;

          if (IMG_FORMAT === SVG_FORMAT) {
            colors = chooseColors(paletteGroups, availablePalettes);
          }

          if (gif.export) {
            hashlipsGiffer = new HashlipsGiffer(
              canvas,
              ctx,
              `${FOLDERS.gifsDir}/${abstractedIndexes[0]}.gif`,
              gif.repeat,
              gif.quality,
              gif.delay
            );
            hashlipsGiffer.start();
          }
          if (background.generate) {
            drawBackground();
          }
          renderObjectArray.forEach((renderObject, index) => {
            drawElement(
              renderObject,
              index,
              layerConfigurations[layerConfigIndex].layersOrder.length,
              colors
            );
            if (gif.export) {
              hashlipsGiffer.add();
            }
          });
          if (gif.export) {
            hashlipsGiffer.stop();
          }
          debugLogs
            ? console.log("Editions left to create: ", abstractedIndexes)
            : null;
          saveImage(abstractedIndexes[0]);
          addMetadata(newDna, abstractedIndexes[0]);
          saveMetaDataSingleFile(abstractedIndexes[0]);
          console.log(
            `Created edition: ${abstractedIndexes[0]}, with DNA: ${sha1(
              newDna
            )} and colors: `,
            colors
          );
        });
        dnaList.add(filterDNAOptions(newDna));
        selectedTraitsList.add(traits);
        editionCount++;
        abstractedIndexes.shift();
      } else {
        console.log("DNA exists!");
        failedCount++;
        if (failedCount >= uniqueDnaTorrance) {
          console.log(
            `You need more layers or elements to grow your edition to ${layerConfigurations[layerConfigIndex].growEditionSizeTo} artworks!`
          );
          writeMetaData(JSON.stringify(metadataList, null, 2));
          process.exit();
        }
      }
    }
    layerConfigIndex++;
  }
  writeMetaData(JSON.stringify(metadataList, null, 2));
};

module.exports = { startCreating, buildSetup, getElements };
