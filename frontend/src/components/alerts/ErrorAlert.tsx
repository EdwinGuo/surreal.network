/* This example requires Tailwind CSS v2.0+ */
import { XCircleIcon } from "@heroicons/react/solid";

export interface ErrorAlertProps {
  messages: Array<string>;
}

export default function ErrorAlert(props: ErrorAlertProps) {
  return (
    <div className="rounded-md bg-red-50 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            There were {props.messages.length} errors with your submission
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <ul role="list" className="list-disc pl-5 space-y-1">
              {props.messages.map((message) => {
                return <li key={message}>{message}</li>;
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
