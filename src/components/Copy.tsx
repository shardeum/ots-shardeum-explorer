import { faCheckCircle, faCopy } from "@fortawesome/free-regular-svg-icons";
import { faCheck, faExclamationCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState } from "react";

type CopyProps = {
  value: string;
  rounded?: boolean;
};

const Copy: React.FC<CopyProps> = ({ value, rounded }) => {
  const [copying, setCopying] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  const doCopy = async () => {
    try {
      // First check if we have clipboard permissions
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(value);
        setCopying(true);
        setError(false);

        setTimeout(() => {
          setCopying(false);
        }, 1000);
      } else {
        // Fallback for browsers that don't support clipboard API
        const textArea = document.createElement("textarea");
        textArea.value = value;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          document.execCommand("copy");
          textArea.remove();
          setCopying(true);
          setError(false);

          setTimeout(() => {
            setCopying(false);
          }, 1000);
        } catch (err) {
          textArea.remove();
          setError(true);
          setTimeout(() => {
            setError(false);
          }, 2000);
        }
      }
    } catch (err) {
      console.error("Failed to copy:", err);
      setError(true);
      setTimeout(() => {
        setError(false);
      }, 2000);
    }
  };

  return (
    <button
      className={`flex-no-wrap flex items-center justify-center space-x-1 self-center text-gray-500 focus:outline-none ${
        rounded
          ? "transition-shadows h-7 w-7 rounded-full bg-gray-200 text-xs transition-colors hover:bg-gray-500 hover:text-gray-200 hover:shadow"
          : "text-sm"
      }`}
      title="Click to copy to clipboard"
      onClick={doCopy}
    >
      {error ? (
        <>
          <FontAwesomeIcon 
            icon={faExclamationCircle} 
            size="1x" 
            className="text-red-500" 
          />
          {!rounded && <span className="self-baseline text-red-500">Failed to copy</span>}
        </>
      ) : copying ? (
        rounded ? (
          <FontAwesomeIcon icon={faCheck} size="1x" className="text-green-500" />
        ) : (
          <>
            <FontAwesomeIcon icon={faCheckCircle} size="1x" className="text-green-500" />
            <span className="self-baseline text-green-500">Copied!</span>
          </>
        )
      ) : (
        <FontAwesomeIcon icon={faCopy} size="1x" />
      )}
    </button>
  );
};

export default React.memo(Copy);
