import { spawn } from 'child_process';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export class PythonService {
    private static runPythonScript(executable: string, scriptPath: string, args: string[], useJSONEnvelope: boolean = false): Promise<{ result: any, logs: string }> {
        return new Promise((resolve, reject) => {
            const pythonExecutable = executable || process.env.AI_PYTHON_EXECUTABLE || 'python';
            const scriptDir = path.dirname(scriptPath);
            const scriptName = path.basename(scriptPath);

            console.log(`🚀 AI Engine: Spawning process ${pythonExecutable} for ${scriptName} in ${scriptDir}`);

            const pythonProcess = spawn(pythonExecutable, args, {
                cwd: scriptDir,
                env: { ...process.env, PYTHONPATH: scriptDir }
            });

            let dataString = '';
            let errorString = '';

            pythonProcess.stdout.on('data', (data) => {
                const chunk = data.toString();
                dataString += chunk;
                // Optional: stream to terminal for dev visibility
                if (process.env.DEBUG === 'True') process.stdout.write(`[PY STDOUT] ${chunk}`);
            });

            pythonProcess.stderr.on('data', (data) => {
                const chunk = data.toString();
                errorString += chunk;
                if (process.env.DEBUG === 'True') process.stderr.write(`[PY STDERR] ${chunk}`);
            });

            pythonProcess.on('close', (code) => {
                if (code !== 0 && code !== null) {
                    console.error(`❌ Python Process Terminated (Code ${code})`);
                    return reject(new Error(errorString || `Execution failed with code ${code}`));
                }

                try {
                    // Extract JSON reasoning payloads across different marker conventions
                    let result = null;
                    const logContent = dataString;

                    // Improved Regex for any marker ending in _START--- and _END---
                    const startMatch = logContent.match(/---[A-Z_]+_START---/);
                    const endMatch = logContent.match(/---[A-Z_]+_END---/);

                    if (startMatch && endMatch) {
                        const startIndex = logContent.indexOf(startMatch[0]) + startMatch[0].length;
                        const endIndex = logContent.indexOf(endMatch[0]);
                        const jsonPart = logContent.substring(startIndex, endIndex).trim();
                        result = JSON.parse(jsonPart);
                    } else {
                        // Fallback: search for the most complete JSON object in the log stream
                        const matches = logContent.match(/\{[\s\S]*\}/g);
                        if (matches) {
                            for (let i = matches.length - 1; i >= 0; i--) {
                                try {
                                    result = JSON.parse(matches[i]);
                                    break;
                                } catch (e) { continue; }
                            }
                        }
                    }

                    if (!result) {
                        console.warn('⚠️ No structured JSON reasoning found in AI output.');
                        result = {
                            ai_response: "Diagnostic trace completed. Internal reasoning extracted but no final summary formatted.",
                            status: 'incomplete'
                        };
                    }

                    resolve({ result, logs: logContent });
                } catch (e) {
                    console.error('🔥 AI Node parsing failure:', e);
                    reject(new Error('Internal Handshake Error: Failed to parse clinical reasoning data.'));
                }
            });
        });
    }

    static async executeModule1(textInput: string, audioPath?: string): Promise<any> {
        const scriptPath = process.env.MODULE1_SCRIPT_PATH || '';
        const pythonExecutable = process.env.MODULE1_PYTHON_EXECUTABLE || '';

        const args = [scriptPath];
        if (audioPath) {
            args.push(audioPath);
        } else if (textInput) {
            args.push(textInput);
            args.push('--text');
        }

        const { result, logs } = await this.runPythonScript(pythonExecutable, scriptPath, args);
        return { ...result, logs };
    }

    static async executeModule2(imagePath: string): Promise<any> {
        const scriptPath = process.env.MODULE2_SCRIPT_PATH || '';
        const pythonExecutable = process.env.MODULE2_PYTHON_EXECUTABLE || '';

        const args = [scriptPath, imagePath];

        const { result, logs } = await this.runPythonScript(pythonExecutable, scriptPath, args);
        return { ...result, logs };
    }

    static async executeModule3(vcfPath: string): Promise<any> {
        const scriptPath = process.env.MODULE3_SCRIPT_PATH || '';
        const pythonExecutable = process.env.MODULE3_PYTHON_EXECUTABLE || '';
        const clinvarDbPath = process.env.MODULE3_CLINVAR_DB || '';

        const args = [scriptPath, '--vcf', vcfPath];
        if (clinvarDbPath) {
            args.push('--clinvar');
            args.push(clinvarDbPath);
        }

        const { result, logs } = await this.runPythonScript(pythonExecutable, scriptPath, args);
        return { ...result, logs };
    }

    static async executeModule4(userData: any): Promise<any> {
        const scriptPath = process.env.MODULE4_SCRIPT_PATH || '';
        const pythonExecutable = process.env.MODULE4_PYTHON_EXECUTABLE || '';

        const userId = userData.userId || 'anonymous';
        const observation = userData.observation || 'Analysis requested';

        const args = [scriptPath, userId, observation];

        const { result, logs } = await this.runPythonScript(pythonExecutable, scriptPath, args);
        return { ...result, logs };
    }
}
