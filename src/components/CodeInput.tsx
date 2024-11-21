import { useState } from "react";
import { Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface CodeSection {
  name: string;
  lines: string;
}

interface CodeFile {
  filename: string;
  description?: string;
  sections?: CodeSection[];
  code: string;
}

interface CodeInputProps {
  onUpdatePrompt: (metadata: string) => void;
}

const CodeInput = ({ onUpdatePrompt }: CodeInputProps) => {
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [showNewFileForm, setShowNewFileForm] = useState(false);
  const [newFile, setNewFile] = useState<CodeFile>({
    filename: "",
    code: "",
  });
  const [showSections, setShowSections] = useState(false);
  const [newSection, setNewSection] = useState<CodeSection>({
    name: "",
    lines: "",
  });

  const generateMetadata = (files: CodeFile[]): string => {
    if (files.length === 0) return "";
  
    let metadata = "# File Context Block\n@files\n";
    
    files.forEach(file => {
      metadata += `${file.filename}:\n`;
      
      if (file.description) {
        metadata += `  description: "${file.description}"\n`;
      }
      
      if (file.sections && file.sections.length > 0) {
        metadata += `  sections:\n`;
        file.sections.forEach(section => {
          metadata += `    - name: "${section.name}"\n`;
          metadata += `      lines: ${section.lines}\n`;
          metadata += `      content: \`\`\`${getFileExtension(file.filename)}\n`;
          metadata += `        ${getCodeSection(file.code, section.lines)}\n`;
          metadata += `        \`\`\`\n`;
        });
      }
  
      metadata += `  content: \`\`\`${getFileExtension(file.filename)}\n`;
      metadata += `${file.code}\n`;
      metadata += `  \`\`\`\n`;
    });
    
    metadata += "@end\n\n";
    
    metadata += "# User Message: \n\n";
    
    return metadata;
  };
  
  // Helper function to get file extension
  const getFileExtension = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const extensionMap: { [key: string]: string } = {
      'py': 'python',
      'js': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'jsx': 'javascript',
      'css': 'css',
      'html': 'html',
      // Add more mappings as needed
    };
    return extensionMap[ext] || ext;
  };
  
  // Helper function to extract code section based on line numbers
  const getCodeSection = (code: string, lines: string): string => {
    const [start, end] = lines.split('-').map(num => parseInt(num.trim()));
    const codeLines = code.split('\n');
    
    if (!start || !end || start > end || start < 1 || end > codeLines.length) {
      return code; // Return full code if line numbers are invalid
    }
    
    return codeLines.slice(start - 1, end).join('\n');
  };

  const addSection = () => {
    if (newSection.name && newSection.lines) {
      setNewFile(prev => ({
        ...prev,
        sections: [...(prev.sections || []), newSection]
      }));
      setNewSection({ name: "", lines: "" });
    }
  };

  const addFile = () => {
    if (newFile.filename && newFile.code) {
      setFiles(prev => [...prev, newFile]);
      setNewFile({ filename: "", code: "" });
      setShowNewFileForm(false);
      setShowSections(false);
      
      // Update the prompt with new metadata
      const newMetadata = generateMetadata([...files, newFile]);
      onUpdatePrompt(newMetadata);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      const newMetadata = generateMetadata(newFiles);
      onUpdatePrompt(newMetadata);
      return newFiles;
    });
  };

  return (
    <div className="space-y-4 mb-4">
      {/* File List */}
      <div className="space-y-2">
        {files.map((file, index) => (
          <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
            <span className="flex-1 font-mono text-sm">{file.filename}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeFile(index)}
              className="h-8 w-8 text-gray-500 hover:text-red-500"
            >
              <X size={16} />
            </Button>
          </div>
        ))}
      </div>

      {/* Add Code Button */}
      {!showNewFileForm && (
        <Button
          variant="outline"
          onClick={() => setShowNewFileForm(true)}
          className="w-full flex items-center gap-2"
        >
          <Plus size={16} />
          Add Code
        </Button>
      )}

      {/* New File Form */}
      {showNewFileForm && (
        <div className="space-y-4 p-4 border rounded-lg">
          <div className="space-y-2">
            <Label>Filename*</Label>
            <Input
              placeholder="e.g., main.py"
              value={newFile.filename}
              onChange={e => setNewFile(prev => ({
                ...prev,
                filename: e.target.value
              }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Input
              placeholder="Brief description of the file"
              value={newFile.description || ""}
              onChange={e => setNewFile(prev => ({
                ...prev,
                description: e.target.value
              }))}
            />
          </div>

          {/* Sections Accordion */}
          <div>
            <Button
              variant="ghost"
              onClick={() => setShowSections(!showSections)}
              className="w-full flex items-center justify-between"
            >
              Sections (optional)
              {showSections ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
            
            {showSections && (
              <div className="mt-2 space-y-4 p-4 border rounded-lg">
                {newFile.sections?.map((section, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <span>{section.name}: lines {section.lines}</span>
                  </div>
                ))}
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Section Name</Label>
                    <Input
                      placeholder="e.g., caching"
                      value={newSection.name}
                      onChange={e => setNewSection(prev => ({
                        ...prev,
                        name: e.target.value
                      }))}
                    />
                  </div>
                  <div>
                    <Label>Line Numbers</Label>
                    <Input
                      placeholder="e.g., 15-30"
                      value={newSection.lines}
                      onChange={e => setNewSection(prev => ({
                        ...prev,
                        lines: e.target.value
                      }))}
                    />
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  onClick={addSection}
                  className="w-full"
                  disabled={!newSection.name || !newSection.lines}
                >
                  Add Section
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Code*</Label>
            <Textarea
              placeholder="Paste your code here"
              value={newFile.code}
              onChange={e => setNewFile(prev => ({
                ...prev,
                code: e.target.value
              }))}
              className="font-mono min-h-[200px]"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="default"
              onClick={addFile}
              disabled={!newFile.filename || !newFile.code}
              className="flex-1"
            >
              Add File
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setShowNewFileForm(false);
                setShowSections(false);
                setNewFile({ filename: "", code: "" });
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export { CodeInput };