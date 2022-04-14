const BASEDIR = process.cwd();
const { FOLDERS } = require(`${BASEDIR}/constants/folders.js`);
const { MODE } = require(`${FOLDERS.constantsDir}/blend_mode.js`);
const { NETWORK } = require(`${FOLDERS.constantsDir}/network.js`);

const IMG_FORMAT = "svg";

const network = NETWORK.eth;

const solanaMetadata = {
  symbol: "STB",
  seller_fee_basis_points: 1000, // Define how much % you want from secondary market sales 1000 = 10%
  external_url: "YOUR_WEBSITE_URL_HERE", // Add your website URL here. Ex. https://thepeanutgalleryandco.co.za/
  creators: [
    {
      address: "YOUR_WALLET_ADDRESS_HERE", // Add your owner wallet address here. Ex. 0x5cE5D823f4bD8Ec610868fBa65832B479152C7E1
      share: 100,
    },
  ],
};

const layerConfigurations = [
  {
    growEditionSizeTo: 16,
    layersOrder: [
      { name: "00 Background", group: "background" },
      { name: "01 Base", group: "body" },
      { name: "02 Antenna", group: "hat" },
      { name: "03 Head", group: "body" },
      { name: "04 Eyes", group: "details" },
      { name: "05 Ears", group: "details" },
      { name: "06 MouthNose", group: "details" },
      { name: "07 Hats", group: "hat" },
      { name: "08 Bottom", group: "body" },
    ],
  },
];

// If you have selected Solana then the collection starts from 0 automatically
// const layerConfigurations = [
//   {
//     growEditionSizeTo: 27,
//     layersOrder: [
//       { name: "bkg" },
//       { name: "mid" },
//       { name: "top" }
//     ]
//   },
// ];

/* Example of configuration settings
const layerConfigurations = [
  {
    growEditionSizeTo: 2,
    maxRepeatedTraits: 1,
    layersOrder: [
      { name: "Background" },
      { name: "Eyeball" },
      { name: "Eye color", maxRepeatedTrait: 2 },
      { name: "Iris" },
      { name: "Shine" },
      { name: "Bottom lid", maxRepeatedTrait: 3 },
      { name: "Top lid" },
    ],
    layerItemsMaxRepeatedTraits: [
      { name: "Background/Black", layerItemMaxRepeatedTrait: 4 },
      { name: "Eyeball/Red", layerItemMaxRepeatedTrait: 5 }
    ],
    incompatibleTraits: {
      "Eye color/Cyan": [
        "Eyeball/Red",
      ],
      "Iris/Large": [
        "Bottom lid/High",
        "Top lid/High"
      ],
    },
    dependentTraits: {
      "Eye color/Cyan": [
        "Eyeball/White",
      ],
      "Background/Blue": [
        "Eyeball/Red",
        "Top lid/low"
      ],
    }
  },
];
*/

const shuffleLayerConfigurations = false;

const debugLogs = false;

const format = {
  width: 362,
  height: 362,
  smoothing: false,
};

const gif = {
  export: false,
  repeat: 0,
  quality: 100,
  delay: 500,
};

const text = {
  only: false,
  color: "#ffffff",
  size: 20,
  xGap: 40,
  yGap: 40,
  align: "left",
  baseline: "top",
  weight: "regular",
  family: "Courier",
  spacer: " => ",
};

const pixelFormat = {
  ratio: 2 / 128,
};

const background = {
  generate: true,
  brightness: "80%",
  static: false,
  default: "#000000",
};

// These are additional items that will be added to each NFT. You can remove them or add new ones as well if needed.
// Uncomment the lines if you would like to use these and update the details.
const extraMetadata = {
  //creator: "NFT_CREATOR_HERE", // Add the creator of the NFT collection here. Ex. The Peanut Gallery And Co
  //external_url: "YOUR_WEBSITE_URL_HERE"  // Add your website URL here. This will be added to each of your NFTs. Ex. https://thepeanutgalleryandco.co.za/
};

const rarityDelimiter = "#";

const uniqueDnaTorrance = 10000;

const preview = {
  thumbPerRow: 5,
  thumbWidth: 50,
  imageRatio: format.height / format.width,
  imageName: "preview.png",
};

const preview_gif = {
  numberOfImages: 5,
  order: "ASC", // ASC, DESC, MIXED
  repeat: 0,
  quality: 100,
  delay: 500,
  imageName: "preview.gif",
};

const paletteGroups = [
  {
    name: "sample",
    palettes: {
      background: ["white"],
      body: ["brown"],
      hat: ["blue"],
      details: ["yellow"],
    },
  },
];

const palettes = {
  brown: {
    fill: ["#B2A29D"],
    stroke: ["#3E241E"],
  },
  blue: {
    fill: ["#A3C1E1"],
    stroke: ["#284962"],
  },
  white: ["#ffffff"],
  yellow: ["#FCFC54"],
};

module.exports = {
  format,
  background,
  uniqueDnaTorrance,
  layerConfigurations,
  rarityDelimiter,
  preview,
  shuffleLayerConfigurations,
  debugLogs,
  extraMetadata,
  pixelFormat,
  text,
  network,
  solanaMetadata,
  gif,
  preview_gif,
  IMG_FORMAT,
  paletteGroups,
  palettes,
};
