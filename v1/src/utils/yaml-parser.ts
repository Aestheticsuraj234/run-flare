import * as yaml from 'js-yaml';

export class YamlParser {
    /**
     * Convert YAML content to JSON
     */
    static yamlToJson(yamlContent: string): any {
        try {
            return yaml.load(yamlContent);
        } catch (error) {
            throw new Error(`Failed to parse YAML: ${error}`);
        }
    }

    /**
     * Convert JSON to YAML
     */
    static jsonToYaml(jsonContent: any): string {
        try {
            return yaml.dump(jsonContent);
        } catch (error) {
            throw new Error(`Failed to convert to YAML: ${error}`);
        }
    }
}
