import { Dialog } from "@headlessui/react";
import { QrReader } from "@otterscan/react-qr-reader";
import { OnResultFunction } from "@otterscan/react-qr-reader/dist-types/types";
import { BarcodeFormat } from "@zxing/library";
import { isAddress } from "ethers";
import React from "react";
import { useNavigate } from "react-router-dom";

export interface CameraScannerProps {
  onClose: () => void;
  onScan: (result: string) => void;
}

const CameraScanner: React.FC<CameraScannerProps> = ({ onClose, onScan }) => {
  const navigate = useNavigate();

  const evaluateScan: OnResultFunction = (result, error, codeReader) => {
    console.log("scan");
    if (!error && result?.getBarcodeFormat() === BarcodeFormat.QR_CODE) {
      const text = result.getText();
      console.log(`Scanned: ${text}`);
      if (!isAddress(text)) {
        console.warn("Not an ETH address");
        return;
      }

      navigate(`/search?q=${text}`);
      onScan(text);
    }
  };

  return (
    <Dialog
      className="fixed inset-0 z-10 overflow-y-auto"
      open={true}
      onClose={onClose}
    >
      <div className="flex min-h-screen items-center justify-center">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
        <Dialog.Title className="absolute top-0 w-full bg-white text-center text-lg">
          Point an ETH address QR code to camera
        </Dialog.Title>
        <div className="absolute inset-0 m-auto h-screen max-h-screen w-full min-w-max max-w-3xl rounded bg-transparent">
          <QrReader
            className="m-auto"
            constraints={{}}
            onResult={evaluateScan}
          />
        </div>
      </div>
    </Dialog>
  );
};

export default CameraScanner;
