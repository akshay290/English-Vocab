# Dataset notes

This app contains 2,027 one-word substitutions and 1,281 idioms. Each JSON file has an `entries` array. Every entry's `image` is a relative path to a matching JPG inside its dataset folder.

The records and JPG crops come from the user-supplied PDFs. The `source_pdf`, `source_page`, and `source_side` fields show where each record came from. Optional `review_flags` mark text that may need proofreading against the image.

The OWS JSON in this app corrects one verified transcription error in entry 2027 (`Zoology`): its English meaning now ends with “animals”. The original file in Downloads was left unchanged. Other review flags were preserved; 696 OWS entries have at least one. The idiom dataset has four source-text review flags.

The original ZIP archives are not required at runtime. The app uses the unpacked JSON and JPG files in this directory.
