# Clear Cache Instructions

If you're getting the "Cannot find module 'sass'" error, try these steps:

1. **Stop the development server** (Ctrl+C in the terminal)

2. **Delete node_modules and package-lock.json:**
   ```powershell
   Remove-Item -Recurse -Force node_modules
   Remove-Item package-lock.json
   ```

3. **Clear npm cache:**
   ```powershell
   npm cache clean --force
   ```

4. **Reinstall all dependencies:**
   ```powershell
   npm install
   ```

5. **Start the dev server again:**
   ```powershell
   npm start
   ```

Alternative: If the above doesn't work, try:
```powershell
npm install sass@latest --save-dev
npm start
```

