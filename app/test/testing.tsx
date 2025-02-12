import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";

export default function LaunchAgent() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center py-40 mx-2">
      <h1 className="text-3xl font-semibold mb-6">Launch Agent</h1>
      <div className="w-full max-w-2xl space-y-6">
        <Card className="bg-gray-800 p-6">
          <CardContent className="space-y-4">
            <Label className="text-lg">Basic Information</Label>
            <Label>Name:</Label>
            <Input placeholder="Write agent name" className="bg-gray-700 border-none" />
            
            <Label>Upload Image:</Label>
            <div className="flex space-x-4">
              <div className="border-2 border-dashed p-6 w-full flex flex-col items-center justify-center bg-gray-700">
                <Upload size={24} className="text-blue-500" />
                <p>Drag file here to upload or Choose File</p>
                <p className="text-sm text-gray-400">Recommended size 1024 x 1024 px</p>
              </div>
              <div className="border p-6 w-1/3 flex flex-col items-center justify-center bg-gray-700">
                <Upload size={24} className="text-blue-500" />
                <p>Preview after upload</p>
              </div>
            </div>
            
            <Label>One Liner:</Label>
            <Input placeholder="Write agent one liner" className="bg-gray-700 border-none" />
            <p className="text-sm text-gray-400">Max 90 characters with spaces</p>
            
            <Label>Description:</Label>
            <Textarea placeholder="Write agent description" className="bg-gray-700 border-none" />
            <p className="text-sm text-gray-400">Max 300 characters with spaces</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 p-6">
          <CardContent className="space-y-4">
            <Label className="text-lg">Character Information</Label>
            <Label>Bio:</Label>
            <Input placeholder="Add your own bio" className="bg-gray-700 border-none" />
            <div className="flex space-x-2">
              <Button variant="outline">Add</Button>
              <Button variant="default">Generate from AI</Button>
            </div>
            
            <Label>Lore:</Label>
            <Input placeholder="Add your own lore" className="bg-gray-700 border-none" />
            <div className="flex space-x-2">
              <Button variant="outline">Add</Button>
              <Button variant="default">Generate from AI</Button>
            </div>
            
            <Label>Knowledge:</Label>
            <Input placeholder="Add your own knowledge" className="bg-gray-700 border-none" />
            <div className="flex space-x-2">
              <Button variant="outline">Add</Button>
              <Button variant="default">Generate from AI</Button>
            </div>
          </CardContent>
        </Card>
        
        <Button className="w-full bg-blue-500 hover:bg-blue-600">Launch Agent</Button>
      </div>
    </div>
  );
}
