import torch
import sys
import os

repo_path = r"d:\Unisys\liveness-detection\backend\repo\Silent-Face-Anti-Spoofing-master"
sys.path.append(repo_path)
from src.model_lib.MiniFASNet import MiniFASNetV2

def export_model():
    model = MiniFASNetV2(conv6_kernel=(5, 5), num_classes=3)
    model_path = os.path.join(repo_path, "resources", "anti_spoof_models", "2.7_80x80_MiniFASNetV2.pth")
    
    checkpoint = torch.load(model_path, map_location='cpu')
    
    if 'state_dict' in checkpoint:
        state_dict = checkpoint['state_dict']
    else:
        state_dict = checkpoint
        
    new_state_dict = {k.replace('module.', ''): v for k, v in state_dict.items()}
    model.load_state_dict(new_state_dict, strict=False)
    
    model.eval()
    
    dummy_input = torch.randn(1, 3, 80, 80)
    onnx_path = r"d:\Unisys\liveness-detection\backend\MiniFASNetV2.onnx"
    
    torch.onnx.export(
        model, 
        dummy_input, 
        onnx_path, 
        opset_version=11, 
        input_names=['input'], 
        output_names=['output'],
        dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}
    )
    print(f"Successfully exported to {onnx_path}")

if __name__ == '__main__':
    export_model()
