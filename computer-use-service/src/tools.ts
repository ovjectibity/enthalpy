import { exec, execSync } from "child_process";
import * as fs from "fs";
import sharp from "sharp";

export class ComputerTool {
  name: string;
  type: "custom";
  private display_width_px: number;
  private display_height_px: number;
  private display_number: number;
  description: string;

  constructor() {
    this.name = "computer";
    this.type = "custom";
    this.display_number = 1;

    // Get screen dimensions
    const dimensions = this.getScreenDimensions();
    this.display_width_px = dimensions.width;
    this.display_height_px = dimensions.height;
    this.description =
      `Use this tool to use & navigate the local computer instance. ` +
      `Screen dimensions: ${this.display_width_px}x${this.display_height_px} pixels. ` +
      `You can use the tool to perform specific actions such as ` +
      `taking a screenshot of the current view, ` +
      `scrolling up or down or left-clicking or right-clicking on a particular coordinate (x,y). ` +
      `All coordinates should be within the screen bounds (0,0) to (${this.display_width_px},${this.display_height_px}).`;
  }

  getScreenDimensions(): { width: number; height: number } {
    const cmd = "xdpyinfo | grep dimensions | awk '{print $2}'";

    try {
      const output = execSync(cmd, { encoding: "utf8" }).trim();
      // Output format: "1920x1080"
      const [width, height] = output.split("x").map(Number);
      return { width, height };
    } catch (error) {
      console.warn(`Failed to get screen dimensions: ${error}`);
      // Fallback to common defaults
      return { width: 1920, height: 1080 };
    }
  }

  async getScreenshot(): Promise<string> {
    const file = "./tmp/abc.png";
    const file2 = "./tmp/abc2.jpg";
    const cmd = `scrot "${file}"`;

    return new Promise((res, rej) => {
      exec(cmd, (error, stdout, stderr) => {
        console.log(`Running screenshot`, error, stdout, stderr);
        if (error) {
          rej(`Error taking screenshot: ${error.message}`);
        } else {
          this.optimizeScreenshot(file, file2)
            .then((base64encoded) => {
              res(base64encoded);
            })
            .catch((optimizeError: any) => {
              console.error("Error optimizing screenshot:", optimizeError);
              rej(`Error optimizing screenshot: ${optimizeError.message}`);
            });
        }
      });
    });
  }

  private async optimizeScreenshot(
    inputFile: string,
    outputFile: string,
  ): Promise<string> {
    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
    const MAX_SIZE_BASE64 = Math.floor(MAX_SIZE_BYTES * 0.75); // Account for base64 encoding overhead

    // Calculate optimal dimensions maintaining aspect ratio
    const aspectRatio = this.display_width_px / this.display_height_px;
    let targetWidth = 1920; // Start with a high quality target
    let targetHeight = Math.round(targetWidth / aspectRatio);

    // Ensure we don't exceed original dimensions
    if (targetWidth > this.display_width_px) {
      targetWidth = this.display_width_px;
      targetHeight = this.display_height_px;
    }

    let quality = 95; // Start with high quality for JPG
    let attempt = 0;
    const maxAttempts = 10;

    while (attempt < maxAttempts) {
      try {
        let sharpInstance = sharp(inputFile).resize({
          width: targetWidth,
          height: targetHeight,
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 1 },
        });

        // Always use JPEG for consistent output and better compression
        sharpInstance = sharpInstance.jpeg({ quality, mozjpeg: true });

        await sharpInstance.toFile(outputFile);

        // Check file size
        const fileStats = fs.statSync(outputFile);
        const base64Size = Math.ceil((fileStats.size * 4) / 3); // Estimate base64 size

        console.log(
          `Screenshot attempt ${attempt + 1}: ${fileStats.size} bytes (base64: ~${base64Size}), quality: ${quality}, dimensions: ${targetWidth}x${targetHeight}`,
        );

        if (base64Size <= MAX_SIZE_BASE64) {
          // Success! Read and return base64
          const data = fs.readFileSync(outputFile);
          return Buffer.from(data).toString("base64");
        }

        // File too large, reduce quality or dimensions
        if (quality > 60) {
          quality -= 10;
        } else {
          // Reduce dimensions by 20%
          targetWidth = Math.round(targetWidth * 0.8);
          targetHeight = Math.round(targetHeight * 0.8);
          quality = 85; // Reset quality when reducing dimensions
        }

        attempt++;
      } catch (error) {
        throw new Error(
          `Sharp processing failed on attempt ${attempt + 1}: ${error}`,
        );
      }
    }

    throw new Error(
      `Could not optimize screenshot under 5MB after ${maxAttempts} attempts`,
    );
  }

  async executeClick(
    x: number,
    y: number,
    clickType: "left" | "right" = "left",
  ): Promise<string> {
    const button = clickType === "right" ? "3" : "1";
    const cmd = `xdotool mousemove ${x} ${y} click ${button}`;

    return new Promise((resolve) => {
      exec(cmd, (error, stdout, stderr) => {
        console.log(
          `Executing ${clickType} click at (${x}, ${y})`,
          error,
          stdout,
          stderr,
        );
        if (error) {
          resolve(`Error executing ${clickType} click: ${error.message}`);
        } else {
          resolve(
            `Successfully ${clickType} clicked at coordinates (${x}, ${y})`,
          );
        }
      });
    });
  }

  async executeType(text: string): Promise<string> {
    // Escape special characters for shell
    const escapedText = text.replace(/'/g, "'\"'\"'");
    const cmd = `xdotool type '${escapedText}'`;

    return new Promise((resolve) => {
      exec(cmd, (error, stdout, stderr) => {
        console.log(
          `Executing type: "${text}"`,
          error,
          stdout,
          stderr,
        );
        if (error) {
          resolve(`Error executing type: ${error.message}`);
        } else {
          resolve(`Successfully typed: "${text}"`);
        }
      });
    });
  }

  async executeScroll(dx: number, dy: number): Promise<string> {
    // xdotool uses button 4/5 for vertical scroll (up/down) and 6/7 for horizontal
    // Positive dy means scroll down, negative means scroll up
    // Positive dx means scroll right, negative means scroll left
    const scrollCommands: string[] = [];

    // Handle vertical scrolling
    if (dy !== 0) {
      const scrollButton = dy > 0 ? "5" : "4"; // 5 = down, 4 = up
      const scrollCount = Math.abs(Math.round(dy / 100)); // Convert pixels to scroll steps
      for (let i = 0; i < scrollCount; i++) {
        scrollCommands.push(`xdotool click ${scrollButton}`);
      }
    }

    // Handle horizontal scrolling
    if (dx !== 0) {
      const scrollButton = dx > 0 ? "7" : "6"; // 7 = right, 6 = left
      const scrollCount = Math.abs(Math.round(dx / 100)); // Convert pixels to scroll steps
      for (let i = 0; i < scrollCount; i++) {
        scrollCommands.push(`xdotool click ${scrollButton}`);
      }
    }

    const cmd = scrollCommands.join(" && ");

    return new Promise((resolve) => {
      if (!cmd) {
        resolve("No scroll action needed (dx=0, dy=0)");
        return;
      }

      exec(cmd, (error, stdout, stderr) => {
        console.log(
          `Executing scroll: dx=${dx}, dy=${dy}`,
          error,
          stdout,
          stderr,
        );
        if (error) {
          resolve(`Error executing scroll: ${error.message}`);
        } else {
          resolve(`Successfully scrolled: dx=${dx}, dy=${dy}`);
        }
      });
    });
  }
}
