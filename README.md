# async api valdator and joiner

A nodejs server providing an rest api (including swagger ui for humans).

This is a tool with 2 puposes.

## Join sync api files

As $ref to non json compatible files (json or yaml) is not yet specified.
This tool anticipates this feature and implements it.

Therefore, you can provide a bunch of files via upload or as zip file.

Currently supported file types to include are:
- *.proto to import protobuf files. Proto imports will be resolved as well. Currently, is only a single namespace supported.

## Validation

Because the asyncapi-parse is only validating the async api part but not the schema part.
This tool does advanced schema validation, including an optional quality check.
The quality check tests if there are description and example for all properties.
