import unittest
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from prepare_sft import normalize
class PrepareSftTests(unittest.TestCase):
 def test_prompt_completion(self):
  x=normalize({"prompt":"Explain osmosis","completion":"Water moves..."})
  self.assertEqual(x["messages"][0]["role"],"user");self.assertEqual(x["messages"][1]["role"],"assistant")
 def test_messages(self):
  x=normalize({"messages":[{"role":"user","content":"What is pH?"},{"role":"assistant","content":"Negative log."}]})
  self.assertEqual(len(x["messages"]),2)
 def test_reject_missing_assistant(self):
  with self.assertRaises(ValueError):normalize({"messages":[{"role":"user","content":"Question?"}]})
 def test_reject_empty(self):
  with self.assertRaises(ValueError):normalize({"prompt":" ","completion":"answer"})
if __name__=="__main__":unittest.main()
