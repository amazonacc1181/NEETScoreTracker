#!/usr/bin/env python3
"""LoRA fine-tuning scaffold for Qwen3; run on a suitable CUDA GPU."""
import argparse,json
from pathlib import Path
from datasets import Dataset
from transformers import AutoModelForCausalLM,AutoTokenizer,Trainer,TrainingArguments,DataCollatorForLanguageModeling
from peft import LoraConfig,get_peft_model,TaskType
def main():
    p=argparse.ArgumentParser();p.add_argument("--base-model",default="Qwen/Qwen3-1.7B");p.add_argument("--train-jsonl",required=True);p.add_argument("--output-dir",required=True);p.add_argument("--epochs",type=float,default=2.0);p.add_argument("--max-length",type=int,default=2048);p.add_argument("--batch-size",type=int,default=1);p.add_argument("--grad-accum",type=int,default=8);p.add_argument("--learning-rate",type=float,default=2e-4);a=p.parse_args()
    tok=AutoTokenizer.from_pretrained(a.base_model,trust_remote_code=False);rows=[]
    for no,line in enumerate(Path(a.train_jsonl).read_text(encoding="utf-8").splitlines(),1):
        if not line.strip():continue
        obj=json.loads(line);rows.append({"text":tok.apply_chat_template(obj["messages"],tokenize=False,add_generation_prompt=False)})
    if not rows:raise SystemExit("No examples.")
    model=AutoModelForCausalLM.from_pretrained(a.base_model,torch_dtype="auto",device_map="auto")
    model=get_peft_model(model,LoraConfig(task_type=TaskType.CAUSAL_LM,r=16,lora_alpha=32,lora_dropout=0.05,target_modules=["q_proj","k_proj","v_proj","o_proj","gate_proj","up_proj","down_proj"]))
    ds=Dataset.from_list(rows)
    def tokenize(batch):return tok(batch["text"],truncation=True,max_length=a.max_length)
    ds=ds.map(tokenize,batched=True,remove_columns=["text"])
    args=TrainingArguments(output_dir=a.output_dir,num_train_epochs=a.epochs,per_device_train_batch_size=a.batch_size,gradient_accumulation_steps=a.grad_accum,learning_rate=a.learning_rate,logging_steps=10,save_strategy="epoch",fp16=True,report_to="none",gradient_checkpointing=True)
    trainer=Trainer(model=model,args=args,train_dataset=ds,data_collator=DataCollatorForLanguageModeling(tokenizer=tok,mlm=False))
    trainer.train();model.save_pretrained(a.output_dir);tok.save_pretrained(a.output_dir)
    print("Adapter saved. Evaluate, merge/export and convert to GGUF separately before Android use.")
if __name__=="__main__":main()
