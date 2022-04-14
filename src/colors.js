const choosePaletteGroup = (paletteGroups) =>
  paletteGroups[Math.floor(Math.random() * paletteGroups.length)];

const choosePalettes = (paletteGroups) =>
  Object.entries(choosePaletteGroup(paletteGroups).palettes).reduce(
    (acc, [k, v]) => Object.assign(acc, { [k]: v[0] }),
    {}
  );

const chooseColors = (paletteGroups, availablePalettes) =>
  Object.entries(choosePalettes(paletteGroups)).reduce((acc, [k, v]) => {
    const availableColors = availablePalettes[v];
    let fill;
    let stroke;
    if (!Array.isArray(availableColors)) {
      if (availableColors.fill) {
        fill =
          availableColors.fill[
            Math.floor(Math.random() * availableColors.fill.length)
          ];
      }
      if (availableColors.stroke) {
        stroke =
          availableColors.stroke[
            Math.floor(Math.random() * availableColors.stroke.length)
          ];
      }
    } else {
      fill =
        availableColors[Math.floor(Math.random() * availableColors.length)];

      // Assign unique fill and stroke from the array of available colors
      // if (availableColors.length > 1) {
      //   fill = availableColors.splice(
      //     Math.floor(Math.random() * availableColors.length),
      //     1
      //   )[0];
      // } else {
      //   fill =
      //     availablePalettes[v][
      //       Math.floor(Math.random() * availablePalettes[v].length)
      //     ];
      // }
      // stroke =
      //   availablePalettes[v][
      //     Math.floor(Math.random() * availablePalettes[v].length)
      //   ];
    }
    return Object.assign(acc, {
      [k]: {
        fill: fill,
        ...(stroke ? { stroke: stroke } : {}),
      },
    });
  }, {});

module.exports = {
  chooseColors,
};
