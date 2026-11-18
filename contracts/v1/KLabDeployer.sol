// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {KLab} from "./KLab.sol";
import {KLabArt, KLabArtFill, KLabArtFx, KLabArtMotion, KLabRenderer, IKLabViewer} from "./KLabRenderer.sol";
import {KLabViewer} from "./KLabViewer.sol";

/// @title THE K.LAB deployers
/// @notice Two transactions deploy the whole collection where the network allows several contracts
/// per transaction (Ethereum today): first the drawing and the 3D viewer, then the renderer and the
/// K1N1 contract, owned by whoever sends the second one. (Where each transaction can create only
/// one contract, the deploy page creates them one by one instead.)
contract KLabDeployArt {
    event ArtDeployed(address art, address viewer);

    constructor() {
        KLabArt art = new KLabArt(new KLabArtFill(), new KLabArtFx(), new KLabArtMotion());
        KLabViewer viewer = new KLabViewer();
        emit ArtDeployed(address(art), address(viewer));
    }
}

contract KLabDeployCollection {
    event Deployed(address renderer, address klab, address owner);

    constructor(KLabArt art, IKLabViewer viewer) {
        KLabRenderer renderer = new KLabRenderer(art, viewer);
        KLab klab = new KLab(address(renderer), msg.sender);
        emit Deployed(address(renderer), address(klab), msg.sender);
    }
}
