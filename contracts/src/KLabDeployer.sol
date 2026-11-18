// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {KLab} from "./KLab.sol";
import {KLabArt3D, KLabArtBg} from "./KLabArt3D.sol";
import {KLabViewer} from "./KLabViewer.sol";
import {KLabRenderer, IKLabArt3D, IKLabViewer} from "./KLabRenderer.sol";

/// @title THE K.LAB deployers
/// @notice Two transactions deploy the collection where a transaction may create several contracts
/// (Ethereum today): first the image and the 3D piece, then the renderer and K1N0, owned by whoever
/// sends the second one, with the K4NCUN0 logo minted to them as K1N0 #0.
contract KLabDeployArt {
    event ArtDeployed(address art, address viewer);

    constructor() {
        emit ArtDeployed(address(new KLabArt3D(new KLabArtBg())), address(new KLabViewer()));
    }
}

contract KLabDeployCollection {
    event Deployed(address renderer, address klab, address owner);

    constructor(address art, address viewer) {
        KLabRenderer renderer = new KLabRenderer(IKLabArt3D(art), IKLabViewer(viewer));
        // the logo: yellow background, purple centre, pink front blocks
        KLab klab = new KLab(address(renderer), msg.sender, 0x00030202, "K4NCUN0");
        emit Deployed(address(renderer), address(klab), msg.sender);
    }
}
