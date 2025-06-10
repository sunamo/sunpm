import {
  exec,
  ExecException,
  spawn,
  SpawnOptionsWithoutStdio,
} from "child_process";
import { ElectronLogger } from "../../types/types";
//import { error } from "electron-log";

export type executeCommandInCmdProps = {
  command: string;
  args?: string[]; // = [];
  options?: SpawnOptionsWithoutStdio; // = {};
  // from electron-log
  log: ElectronLogger;
};

export function executeCommandInCmd(
  props: executeCommandInCmdProps
): Promise<string> {
  const { error } = props.log;
  const { command } = props;
  let { args, options } = props;

  args ??= [];
  options ??= {};

  return new Promise((resolve, reject) => {
    // Default options for cross-platform compatibility
    const defaultOptions = {
      shell: true, // Important: Use shell for complex commands and paths
      windowsHide: true, // Hide the command window on Windows (optional)
    };

    const mergedOptions = { ...defaultOptions, ...options }; // Merge options

    const process = spawn(command, args, mergedOptions);

    let stdoutData = "";
    let stderrData = "";

    process.stdout.on("data", data => {
      stdoutData += data;
    });

    process.stderr.on("data", data => {
      stderrData += data;
      ////console.log(
      //   `tato chyba by se měla objevit i v logu: stderr: ${data} in folder ${props.options?.cwd}`
      // );
      error(`stderr: ${data} in folder ${props.options?.cwd}`); // Log errors to console
    });

    process.on("close", code => {
      if (code === 0) {
        resolve(stdoutData); // Resolve with stdout on success
      } else {
        // git status mě vracel pro adresáře kde není git code 128
        // ani nic do konzole to nevypsalo
        resolve("Something went wrong");
        //reject(new Error(`Command failed with code ${code}\n${stderrData}`)); // Reject with stderr and code on failure
      }
    });

    process.on("error", err => {
      reject(err);
    });
  });
}

export function executeCommandInCmdInDirAsync(
  command: string,
  workingDir: string
): Promise<string | ExecException | null> {
  const options = {
    cwd: workingDir,
  };

  /*
!!! NEMAZAT !!!

zde se to chová úplně píčovsky
error by měl být ExecException. Dokonce i AI to opakovaně tvrdí: https://g.co/gemini/share/75fa75fb9b7d

Co se vrací z exec:
error - strukturovaný objekt
stderr - vše co příkaz vypsal na std. chybový výstup

!!! NEMAZAT !!!
*/

  const result = new Promise<string | ExecException | null>(
    (resolve, reject) => {
      exec(command, options, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(stdout);
      });
    }
  );
  return result;
}

export type executeCommandInCmdAsyncProps = {
  command: string;
};

export async function executeCommandInCmdAsync({
  command,
}: executeCommandInCmdAsyncProps): Promise<string> {
  const result = new Promise<string>((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });

  // zde se ten console_.log for some reason nevypíše.
  //.log("result2", await result);
  return result;
}
