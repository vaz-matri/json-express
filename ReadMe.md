### testing
```
# link
$ cd packages/core
$ pnpm link --global

# start server
$ cd <json_files_dir>
$ json-express

# ctrl + c to stop

# remove global link
$ pnpm remove --global @json-express/core
```

### start dev server
```
$ cd packages/core

# skip if linked
$ pnpm link --global 

$ pnpm dev
```
