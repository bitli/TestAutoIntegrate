"use strict"; // Requires adding a 'var' and removing a 'owth' in AutoIntegrate.js

// TestFindBindingBoxForCrop


// -----------------------------------------------------------------------------------------
// Parameterize the included main script, overloading
// the debug parameters and disabling main()

#define TEST_AUTO_INTEGRATE

var debug = true;
var get_process_defaults = false;

// By default assume that repository is a sibling of AutoIntegrate
// ************* Adapt if needed ********************
#include "../../AutoIntegrate/AutoIntegrate.js"

// -----------------------------------------------------------------------------------------

// DESIGN NOTE: All global variables are prefixed by 'autotest_' to avoid conflicts with AutoIntegrate.j


// -----------------------------------------------------------------------------------------
// *** Options that can be set control the generation and presentation of previews

// Remove the preview ReferenceCrop (if present) after test to better show the generated
// 'crop' preview
autotest_do_delete_referencecrop_after_check = false; 
// -----------------------------------------------------------------------------------------

// Automatic configuration of directories relative to the location of the script file.

// The directory containing the test xisf files (LowRejectionMap_ALL)
let autotest_script_path = ( #__FILE__ );        // Absolute path of the current script file
let autotest_script_directory = autotest_script_path.substring(0,autotest_script_path.lastIndexOf('/')+1);
let autotest_test_rejection_maps_directory = autotest_script_directory + "TestRejectionMaps";

// There is no result directory, results are on the screen

// -----------------------------------------------------------------------------------------

let autotest_generated_preview_name = "crop";
let autotest_reference_preview_name = "ReferenceCrop";
// Print an identifier header
function autotest_logheader()
{
      pixinsight_version_str = CoreApplication.versionMajor + '.' + CoreApplication.versionMinor + '.' + 
      CoreApplication.versionRelease + '-' + CoreApplication.versionRevision;
      pixinsight_version_num = CoreApplication.versionMajor * 1e6 + 
            CoreApplication.versionMinor * 1e4 + 
            CoreApplication.versionRelease * 1e2 + 
            CoreApplication.versionRevision;
      console.noteln("======================================================");
      console.noteln("Automatic test for AutoIntegrate");
      console.noteln("Script ", File.extractName(autotest_script_path));
      console.noteln("Script directory ", autotest_script_directory);
      console.noteln("Test data file directory ", autotest_test_rejection_maps_directory);
      console.noteln("Testing the calculation of the crop bounding box");
      console.noteln("for AutoIntegrate " + autointegrate_version + ", PixInsight v" + pixinsight_version_str + ' (' + pixinsight_version_num + ')');
      console.noteln("======================================================");
}

function autotest_execute(test_name, test_image_file_path)
{
      console.noteln("===================================================");
      console.noteln("Executing test '", test_name, "' with image file '",test_image_file_path,"'");
      let w = ImageWindow.open( test_image_file_path, ""/*id*/, ""/*formatHints*/, true/*asCopy*/ ); // Open a copy
      if (!w || w.isNull)
            throw "Error opening test image '" + test_image_file_path + "'";
      if ( w.length > 1 )
      {
            for ( var j = 1; j < w.length; ++j )
            w[j].forceClose();
            console.writeln( format( "** Warning: Ignoring %d additional image(s): ", w.length-1 ) + test_image_file_path );
      }
      var testWindow = w[0];
      testWindow.show();

      // If the reference image already has a 'crop' preview, delete it
      let previous_crop_preview = testWindow.previewById(autotest_generated_preview_name);
      if (! previous_crop_preview.isNull)
      {
            console.writeln("Deleting preview '",autotest_generated_preview_name,"' of source LowRejectionMap");
            testWindow.deletePreview(previous_crop_preview);
      }


      calculate_crop_amount(test_name);

      // If there is a preview named ReferenceCrop (autotest_reference_preview_name), 
      // check that it has the same boundaries as the 'crop' ( (autotest_generated_preview_name) preview
      // generated by the test.
      // The auto crop  generates a preview names 'crop'.
      // The source LowRejectionMap may include a preview named 'ReferenceCrop' that can be used
      // to compare the generated preview with the reference one for automatic testing.
      // It is also possible to generate the 'ReferenceCrop' or to remove it (after the test) to more clearly
      // show the generated crop preview.
      let crop_preview = testWindow.previewById(autotest_generated_preview_name);
      let reference_crop_preview = testWindow.previewById(autotest_reference_preview_name);

      if (crop_preview.isNull) {
            console.warningln("No preview '",autotest_generated_preview_name,"' generated by test");
      }
      else
      {
            if (reference_crop_preview.isNull) {
                  console.warningln("No preview '",autotest_reference_preview_name,"' to test boundaries");
            }
            else
            {
                  // TODO Should compare the offset of the previews in some way, not only their size
                  if (crop_preview.image.width != reference_crop_preview.image.width
                        || crop_preview.image.height != reference_crop_preview.image.height)
                  {
                        console.warningln("Size of generated preview '",autotest_generated_preview_name,
                              "'does not match preview '",autotest_reference_preview_name,"'");
                  }
                  else
                  {
                        console.noteln("Size of generated preview '",autotest_generated_preview_name,
                        "' matches preview '",autotest_reference_preview_name,"'");
                  }

                  if (autotest_do_delete_referencecrop_after_check)
                  {
                        testWindow.deletePreview(reference_crop_preview);
                        console.writeln("Removed reference preview '",autotest_reference_preview_name,"'");
                  }
            }
      
      }

}

// Execute the test on al ltest files
function autotest_execute_all()
{
      let autotest_test_rejection_maps_directory_path = ensurePathEndSlash((autotest_test_rejection_maps_directory).trim());
      let rejection_map_test_files = searchDirectory( autotest_test_rejection_maps_directory_path+"*.xisf", false );
      console.noteln(rejection_map_test_files.length, " test in ", autotest_test_rejection_maps_directory_path);

      // Close the images of the same name
      for (let test_index in rejection_map_test_files)
      {
            let test_image_file_path = rejection_map_test_files[test_index];
            let test_name = File.extractName(test_image_file_path);
            let existing_window = ImageWindow.windowById(test_name);
            if (! existing_window.isNull) {
                  console.writeln("Closing window '", test_name, "'");
                  existing_window.forceClose();
            }
      }

      // Execute on all files
      for (let test_index in rejection_map_test_files)
      {
            let test_image_file_path = rejection_map_test_files[test_index];
            let test_name = File.extractName(test_image_file_path);
            autotest_execute(test_name, test_image_file_path);
      }
}

autotest_logheader();

autotest_execute_all();

console.noteln("======================================================");
console.noteln("Test terminated, examine the results in the workspace");
console.noteln("======================================================");





// if (false)
// {
//       let debugPreview = lowClipImageWindow.createPreview( 0, 0, full_image.width-1, full_image.height-1, "debug" );
//       let debugImage = debugPreview.image;
//       console.writeln("Full size ",debugImage.width, " ", debugImage.height);
//       let col_mid = debugImage.width / 2;
//       let row_mid = debugImage.height / 2;
//       debugPreview.beginProcess(UndoFlag_NoSwapFile);
//       for (let col=0; col<debugImage.width-1; col++)
//       {
//             debugImage.setSample(1, col, row_mid, 0);
//       }
//       debugPreview.endProcess();
//       //lowClipImageWindow.fitWindow();
// }